import { guessFromScores, PHOTO_PROMPTS, type PhotoGuess } from './photo-labels'

/**
 * Describes a photo ON THE DEVICE with a small open model (CLIP). No API key, no server, and the picture never leaves
 * the phone. The model weights are downloaded once from Hugging Face (about 90 MB) and then cached by the browser.
 */
const MODEL = 'Xenova/clip-vit-base-patch32'

type Classifier = (image: string, labels: string[]) => Promise<Array<{ label: string; score: number }>>
let classifierPromise: Promise<Classifier> | null = null

function loadClassifier(onProgress?: (pct: number) => void): Promise<Classifier> {
  classifierPromise ??= (async () => {
    const { pipeline, env } = await import('@huggingface/transformers')
    env.allowLocalModels = false
    // Self-hosted onnxruntime files (public/ort): nothing executable is fetched from a third-party CDN.
    env.backends.onnx.wasm!.wasmPaths = '/ort/'
    const pipe = await pipeline('zero-shot-image-classification', MODEL, {
      dtype: 'q8',
      progress_callback: (p: { status?: string; progress?: number }) => {
        if (p.status === 'progress' && typeof p.progress === 'number') onProgress?.(Math.round(p.progress))
      },
    })
    return ((image: string, labels: string[]) => pipe(image, labels)) as unknown as Classifier
  })().catch((error) => {
    classifierPromise = null
    throw error
  })
  return classifierPromise
}

export async function describePhotoLocally(
  previewUrl: string,
  language: 'en' | 'hi',
  onProgress?: (pct: number) => void,
): Promise<PhotoGuess | null> {
  const classify = await loadClassifier(onProgress)
  const scores = await classify(previewUrl, [...PHOTO_PROMPTS])
  return guessFromScores(scores, language)
}
