const { createWorker } = require("tesseract.js");

async function extractTextFromImages(files = []) {
  if (files.length === 0) {
    return [];
  }

  let worker = null;

  try {
    worker = await createWorker("eng");

    const results = [];

    for (const file of files) {
      try {
        const recognitionResult =
          await worker.recognize(file.path);

        const extractedText =
          recognitionResult.data.text?.trim() || "";

        results.push({
          filePath: file.path,
          text: extractedText,
          confidence:
            recognitionResult.data.confidence ?? null,
          extractionError: null
        });
      } catch (error) {
        console.error(
          `OCR failed for ${file.originalname}:`,
          error
        );

        results.push({
          filePath: file.path,
          text: "",
          confidence: null,
          extractionError:
            "Unable to extract text from image"
        });
      }
    }

    return results;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

module.exports = {
  extractTextFromImages
};