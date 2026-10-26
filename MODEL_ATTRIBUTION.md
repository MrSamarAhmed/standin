# Model attribution

## Bundled NER model

StandIn bundles the quantized ONNX build of a DistilBERT named-entity-recognition model.

- **Model used by the app:** [`onnx-community/distilbert-NER-ONNX`](https://huggingface.co/onnx-community/distilbert-NER-ONNX)
- **Base model:** [`dslim/distilbert-NER`](https://huggingface.co/dslim/distilbert-NER)
- **File:** `public/models/onnx-community/distilbert-NER-ONNX/onnx/model_quantized.onnx`
- **Size:** 65,772,734 bytes
- **SHA-256:** `9419a876387ff2bbe5f21ab7429c7bef93eac86c50353390d4d8fca6e4a210d8`
- **License:** Apache License 2.0, as declared by the base model
- **License text:** `public/models/onnx-community/distilbert-NER-ONNX/LICENSE-APACHE`

The model card included with the converted files is at `public/models/onnx-community/distilbert-NER-ONNX/README.md`.

The model performs token classification for English text. It is used only for local inference in the browser and is served as a static asset from the application's own origin.

## Runtime

- **Transformers.js** (`@huggingface/transformers`) — Apache-2.0 — loads and runs the model.
- **ONNX Runtime Web** (`onnxruntime-web`) — MIT — is copied into `public/ort/` at install time by `scripts/copy-ort.mjs`.

## Fonts

- **Fraunces** and **Inter** variable fonts, and **IBM Plex Mono** — SIL Open Font License — installed through Fontsource packages and bundled into the production build.

## Application code

The application code is licensed under the MIT License in the repository root. That license does not replace or alter the licenses of the bundled model or other third-party assets.
