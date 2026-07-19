const fs = require("fs/promises");
const { PDFParse } = require("pdf-parse");

async function extractTextFromPDF(filePath) {
  let parser = null;

  try {
    const pdfBuffer = await fs.readFile(filePath);

    parser = new PDFParse({
      data: pdfBuffer
    });

    const result = await parser.getText();

    return {
      text: result.text?.trim() || "",
      pageCount: result.total || null
    };
  } catch (error) {
    console.error(
      "PDF text extraction failed:",
      error
    );

    return {
      text: "",
      pageCount: null,
      extractionError:
        "Unable to extract text from PDF"
    };
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

module.exports = {
  extractTextFromPDF
};