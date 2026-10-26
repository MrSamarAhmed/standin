import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import type { EntityType, ModelDetector, ModelEntity } from './lib/types';

const FIXTURE = [
  'Maya Chen at Horizon Labs is leading the handover.',
  'Write to maya.chen@example.com before Friday.',
  'Reference: MRD-441',
].join('\n');

const RESTORE_ANSWER =
  '[PERSON_1] will reply from [EMAIL_1] about [ID_1]. Ask [PERSON_7] for context.';

function entityAt(
  text: string,
  name: string,
  type: EntityType,
  confidence = 0.97,
): ModelEntity {
  const start = text.indexOf(name);
  if (start < 0) throw new Error(`Fixture does not contain "${name}".`);
  return { start, end: start + name.length, text: name, type, confidence };
}

const twoNamesDetector: ModelDetector = async (chunks) => {
  const entities = [
    entityAt(FIXTURE, 'Maya Chen', 'PERSON'),
    entityAt(FIXTURE, 'Horizon Labs', 'ORG'),
  ];
  return entities.filter((entity) =>
    chunks.some(
      (chunk) =>
        entity.start >= chunk.start && entity.end <= chunk.start + chunk.text.length,
    ),
  );
};

function loadFixture() {
  fireEvent.change(screen.getByLabelText('Document text'), {
    target: { value: FIXTURE },
  });
}

async function scanFixture(user: ReturnType<typeof userEvent.setup>) {
  loadFixture();
  await user.click(screen.getByRole('button', { name: 'Scan locally' }));
  await screen.findByRole('heading', { name: 'Review the cast.' });
}

describe('StandIn journey', () => {
  it('scans, creates a safe copy, and restores a pasted answer', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    render(<App detector={twoNamesDetector} />);
    await scanFixture(user);

    expect(screen.getByText(/4 likely mentions highlighted/)).toBeInTheDocument();
    const castPanel = screen.getByRole('complementary', { name: 'Who becomes what' });
    expect(castPanel).toHaveTextContent('Maya Chen');
    expect(castPanel).toHaveTextContent('Horizon Labs');
    expect(castPanel).toHaveTextContent('4 of 4 selected');

    await user.click(screen.getByRole('button', { name: 'Create safe copy' }));
    await screen.findByRole('heading', { name: 'Ready to share.' });

    const safeCopyText = screen.getByLabelText('Safe copy text');
    expect(safeCopyText).toHaveTextContent('[PERSON_1] at [ORG_1] is leading the handover.');
    expect(safeCopyText).toHaveTextContent('[EMAIL_1]');
    expect(safeCopyText).toHaveTextContent('[ID_1]');
    expect(safeCopyText).not.toHaveTextContent('Maya Chen');
    expect(safeCopyText).not.toHaveTextContent('maya.chen@example.com');
    expect(screen.getByText('0 leaks')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy safe copy' }));
    await screen.findByText('Safe copy copied.');
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('[PERSON_1]');
    expect(writeText.mock.calls[0][0]).not.toContain('Maya Chen');

    const stepper = screen.getByRole('navigation', { name: 'Workspace steps' });
    await user.click(within(stepper).getByRole('button', { name: /Restore/ }));
    await screen.findByRole('heading', { name: 'Bring back the real details.' });
    fireEvent.change(screen.getByLabelText(/Paste the AI.s answer/), {
      target: { value: RESTORE_ANSWER },
    });

    await user.click(screen.getByRole('button', { name: 'Restore real details' }));
    await screen.findByRole('heading', { name: 'The real details are back.' });

    const restored = screen.getByLabelText('Restored answer');
    expect(restored).toHaveTextContent(
      'Maya Chen will reply from maya.chen@example.com about MRD-441.',
    );
    expect(restored).toHaveTextContent('[PERSON_7]');
    expect(screen.getByText('3 restored')).toBeInTheDocument();
    expect(screen.getByText('1 unknown')).toBeInTheDocument();
    expect(screen.getByText('Unknown stand-ins')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy restored answer' }));
    await screen.findByText('Restored answer copied.');
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText.mock.calls[1][0]).toContain('Maya Chen will reply');
    expect(writeText.mock.calls[1][0]).toContain('[PERSON_7]');
  });

  it('marks a safe copy out of date and updates it after a cast change', async () => {
    const user = userEvent.setup();
    render(<App detector={twoNamesDetector} />);
    await scanFixture(user);

    await user.click(screen.getByRole('button', { name: 'Create safe copy' }));
    await screen.findByRole('heading', { name: 'Ready to share.' });

    await user.click(screen.getByRole('button', { name: 'Back to review' }));
    const castPanel = screen.getByRole('complementary', { name: 'Who becomes what' });
    await user.click(within(castPanel).getByRole('button', { name: /Maya Chen/ }));
    const stepper = screen.getByRole('navigation', { name: 'Workspace steps' });
    await user.click(within(stepper).getByRole('button', { name: /Safe copy/ }));

    await screen.findByRole('heading', { name: 'This copy is out of date.' });
    expect(screen.getByRole('button', { name: 'Copy safe copy' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download .txt' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Update safe copy' }));
    await screen.findByRole('heading', { name: 'Ready to share.' });

    const safeCopyText = screen.getByLabelText('Safe copy text');
    expect(safeCopyText).toHaveTextContent('Maya Chen');
    expect(safeCopyText).not.toHaveTextContent('[PERSON_1]');
    expect(screen.getByRole('button', { name: 'Copy safe copy' })).toBeEnabled();
  });

  it('requires acknowledgement when the detectors find nothing', async () => {
    const user = userEvent.setup();
    const detector: ModelDetector = async () => [];

    render(<App detector={detector} />);
    fireEvent.change(screen.getByLabelText('Document text'), {
      target: { value: 'The quarterly planning meeting moved to Thursday afternoon.' },
    });
    await user.click(screen.getByRole('button', { name: 'Scan locally' }));
    await screen.findByRole('heading', { name: 'Review the cast.' });

    expect(screen.getByText(/No highlights found/)).toBeInTheDocument();
    expect(screen.getByText('No likely sensitive details found')).toBeInTheDocument();
    const unprotectedButton = screen.getByRole('button', {
      name: 'Create copy without changes',
    });
    expect(unprotectedButton).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', {
        name: /I understand this copy will be unprotected/,
      }),
    );
    expect(unprotectedButton).toBeEnabled();
    await user.click(unprotectedButton);

    await screen.findByRole('heading', { name: 'An unprotected copy.' });
    expect(screen.getByText('No stand-ins are in this copy.')).toBeInTheDocument();
    expect(screen.getByLabelText('Safe copy text')).toHaveTextContent(
      'The quarterly planning meeting moved to Thursday afternoon.',
    );
  });

  it('falls back to pattern checks and can retry the detector', async () => {
    const user = userEvent.setup();
    let calls = 0;
    const detector: ModelDetector = async () => {
      calls += 1;
      if (calls === 1) throw new Error('The detector could not start.');
      return [entityAt(FIXTURE, 'Maya Chen', 'PERSON')];
    };

    render(<App detector={detector} />);
    await scanFixture(user);

    expect(screen.getByText('Patterns-only scan')).toBeInTheDocument();
    const fallbackCast = screen.getByRole('complementary', { name: 'Who becomes what' });
    expect(fallbackCast).not.toHaveTextContent('Maya Chen');
    expect(fallbackCast).toHaveTextContent('maya.chen@example.com');

    await user.click(screen.getByRole('button', { name: 'Retry detector' }));
    await waitFor(() => {
      expect(screen.queryByText('Patterns-only scan')).not.toBeInTheDocument();
    });
    const retriedCast = screen.getByRole('complementary', { name: 'Who becomes what' });
    expect(retriedCast).toHaveTextContent('Maya Chen');
    expect(calls).toBe(2);
  });

  it('rejects a file that is not plain text', async () => {
    const { container } = render(<App detector={twoNamesDetector} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    const file = new File(['%PDF-1.7'], 'client.pdf', { type: 'application/pdf' });
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose a .txt or .md file.',
    );
    expect(screen.getByLabelText('Document text')).toHaveValue('');
  });

  it('blocks scanning text beyond the 20,000 character limit', () => {
    render(<App detector={twoNamesDetector} />);
    fireEvent.change(screen.getByLabelText('Document text'), {
      target: { value: 'a'.repeat(20_001) },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      '1 character over the 20,000 limit',
    );
    expect(screen.getByRole('button', { name: 'Scan locally' })).toBeDisabled();
  });

  it('cancels a scan without losing the document', async () => {
    const user = userEvent.setup();
    const detector: ModelDetector = () => new Promise<ModelEntity[]>(() => {});

    render(<App detector={detector} />);
    loadFixture();
    await user.click(screen.getByRole('button', { name: 'Scan locally' }));
    await screen.findByText('Scanning locally');

    await user.click(screen.getByRole('button', { name: 'Cancel scan' }));

    expect(screen.getByLabelText('Document text')).toHaveValue(FIXTURE);
    expect(screen.getByRole('button', { name: 'Scan locally' })).toBeEnabled();
    expect(screen.queryByText('Scanning locally')).not.toBeInTheDocument();
  });
});
