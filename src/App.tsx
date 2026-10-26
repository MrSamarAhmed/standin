import { AppShell } from './components/AppShell';
import { useStandIn } from './hooks/useStandIn';
import type { ModelDetector } from './lib/types';

export default function App({ detector }: { detector?: ModelDetector }) {
  const standIn = useStandIn(detector);
  return <AppShell standIn={standIn} />;
}
