const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/*
 * Converts a local image file into a base64 data URL
 * that can be sent to the OpenAI vision model.
 */
function imageToDataURL(filePath, mimeType) {
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString("base64");

  return `data:${mimeType};base64,${base64Image}`;
}

/*
 * Safely parses JSON returned by the model.
 */
function parseModelJSON(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    /*
     * Handles responses accidentally wrapped
     * inside markdown code fences.
     */
    const cleanedText = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedText);
  }
}

/*
 * Verifies a single image against the
 * claimed activity and mapped SDG indicator.
 */
async function verifyImageEvidence({
  filePath,
  mimeType,
  activityText,
  indicatorCode,
  indicatorDescription,
  extractedText = ""
}) {
  try {
    const imageDataURL = imageToDataURL(
      filePath,
      mimeType
    );

    const prompt = `
You are an evidence verification assistant for a local governance SDG platform.

Your task is to determine whether the uploaded image supports the claimed development activity.

Claimed activity:
"${activityText}"

Mapped SDG indicator:
Code: ${indicatorCode}
Description: ${indicatorDescription}

OCR text extracted from the image:
"${extractedText || "No reliable OCR text available"}"

Carefully inspect the image.

Important rules:
1. Verify only what is visibly supported by the image.

2. Do not assume that an activity occurred merely because the claim says so.

3. Check whether the image is relevant to the claimed activity.

4. A road image may support a road-related activity, but it may not prove when or where the road was constructed.

5. A random laptop, person, handwritten page, or unrelated object must not verify a road-related activity.

6. Blurry, dark, cropped, or unclear images should receive a lower verification score.

7. Do not claim exact location, date, ownership, completion status, operational status, measurements, capacity, or expenditure unless these are clearly visible in the image.

8. OCR text may contain errors. Treat low-quality or low-confidence OCR cautiously.

9. Do not evaluate or confirm SDG indicator mapping. Only determine whether the image supports the claimed activity.

Return only valid JSON in the following exact structure:

{
  "status": "VERIFIED | PARTIALLY_VERIFIED | NOT_VERIFIED | INSUFFICIENT_EVIDENCE",
  "score": 0,
  "summary": "Short explanation",
  "visibleElements": [
    "Visible item 1",
    "Visible item 2"
  ],
  "supportingReasons": [
    "Reason 1"
  ],
  "limitations": [
    "Limitation 1"
  ],
  "suspectedActivity": "What activity appears to be shown",
  "imageQuality": "GOOD | MODERATE | POOR"
}

Score guidance:

80-100:
The image clearly and directly supports the claimed activity.

60-79:
The image is relevant and provides reasonable support, but important details cannot be confirmed.

30-59:
The image is only weakly or indirectly related.

0-29:
The image is unrelated, unusable, or contradicts the claim.
`;

    const response = await openai.responses.create({
      model:
        process.env.OPENAI_VISION_MODEL ||
        "gpt-4.1-mini",

      input: [
        {
          role: "user",

          content: [
            {
              type: "input_text",
              text: prompt
            },
            {
              type: "input_image",
              image_url: imageDataURL,
              detail: "auto"
            }
          ]
        }
      ]
    });

    const modelText =
      response.output_text?.trim();

    if (!modelText) {
      throw new Error(
        "Vision model returned an empty response"
      );
    }

    const verification =
      parseModelJSON(modelText);

    const validStatuses = [
      "VERIFIED",
      "PARTIALLY_VERIFIED",
      "NOT_VERIFIED",
      "INSUFFICIENT_EVIDENCE"
    ];

    const validImageQualities = [
      "GOOD",
      "MODERATE",
      "POOR"
    ];

    if (
      !validStatuses.includes(
        verification.status
      )
    ) {
      verification.status =
        "INSUFFICIENT_EVIDENCE";
    }

    const numericScore =
      Number(verification.score);

    verification.score =
      Number.isFinite(numericScore)
        ? Math.min(
            100,
            Math.max(0, numericScore)
          )
        : 0;

    if (
      !validImageQualities.includes(
        verification.imageQuality
      )
    ) {
      verification.imageQuality =
        "POOR";
    }

    verification.summary =
      verification.summary ||
      "No verification summary was provided";

    verification.visibleElements =
      Array.isArray(
        verification.visibleElements
      )
        ? verification.visibleElements
        : [];

    verification.supportingReasons =
      Array.isArray(
        verification.supportingReasons
      )
        ? verification.supportingReasons
        : [];

    verification.limitations =
      Array.isArray(
        verification.limitations
      )
        ? verification.limitations
        : [];

    verification.suspectedActivity =
      verification.suspectedActivity ||
      "Unable to determine";

    return {
      success: true,
      ...verification
    };
  } catch (error) {
    console.error(
      `Image verification failed for ${path.basename(filePath)}:`,
      error
    );

    return {
      success: false,

      status:
        "PENDING_ANALYSIS",

      score:
        null,

      summary:
        "Image verification could not be completed",

      visibleElements:
        [],

      supportingReasons:
        [],

      limitations: [
        error.message ||
          "Vision model verification failed"
      ],

      suspectedActivity:
        "Unable to determine",

      imageQuality:
        null,

      verificationError:
        error.message ||
        "Image verification failed"
    };
  }
}

/*
 * Verifies all image files one by one.
 *
 * A failure in one image does not prevent
 * verification of the remaining images.
 */
async function verifyImageEvidenceFiles({
  files = [],
  activityText,
  indicatorCode,
  indicatorDescription,
  ocrResults = new Map()
}) {
  const results = [];

  for (const file of files) {
    const ocrResult =
      ocrResults.get(file.path);

    const result =
      await verifyImageEvidence({
        filePath:
          file.path,

        mimeType:
          file.mimetype,

        activityText,

        indicatorCode,

        indicatorDescription,

        extractedText:
          ocrResult?.text || ""
      });

    results.push({
      filePath:
        file.path,

      ...result
    });
  }

  return results;
}

module.exports = {
  verifyImageEvidence,
  verifyImageEvidenceFiles
};