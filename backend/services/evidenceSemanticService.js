const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/*
 * Calculate cosine similarity between
 * two embedding vectors.
 *
 * Result normally ranges from -1 to 1.
 * For semantically related text, the
 * useful range is generally closer to 0–1.
 */
function cosineSimilarity(vectorA, vectorB) {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length !== vectorB.length ||
    vectorA.length === 0
  ) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < vectorA.length; index++) {
    dotProduct += vectorA[index] * vectorB[index];

    magnitudeA +=
      vectorA[index] * vectorA[index];

    magnitudeB +=
      vectorB[index] * vectorB[index];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return (
    dotProduct /
    (
      Math.sqrt(magnitudeA) *
      Math.sqrt(magnitudeB)
    )
  );
}

/*
 * Remove unnecessary spaces and limit
 * extremely long extracted documents.
 *
 * This prevents sending very large PDFs
 * directly to the embeddings model.
 */
function cleanEvidenceText(text = "") {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

/*
 * Convert similarity value to
 * a verification status.
 */
function getTextVerificationStatus(similarity) {
  if (similarity >= 0.75) {
    return "TEXT_SUPPORTED";
  }

  if (similarity >= 0.55) {
    return "TEXT_PARTIALLY_SUPPORTED";
  }

  return "TEXT_NOT_SUPPORTED";
}

/*
 * Verify whether extracted evidence text
 * semantically supports the activity claim.
 */
async function verifyEvidenceText({
  activityText,
  evidenceText,
  indicatorCode = "",
  indicatorDescription = "",
  extractionStatus,
  ocrConfidence = null,
  fileType
}) {
  try {
    const cleanedActivityText =
      String(activityText || "").trim();

    const cleanedEvidenceText =
      cleanEvidenceText(evidenceText);

    /*
     * Do not perform semantic verification
     * when no useful evidence text exists.
     */
    if (
      !cleanedEvidenceText ||
      cleanedEvidenceText.length < 10
    ) {
      return {
        success: true,

        textVerificationStatus:
          "NO_USABLE_TEXT",

        textSimilarityScore: null,

        textSimilarityPercentage: null,

        textSupportsActivity: false,

        textVerificationReason:
          "No usable text was extracted from the evidence"
      };
    }

    /*
     * Do not trust badly extracted OCR text.
     *
     * Images are already verified using
     * the vision model, so poor OCR should
     * not create a false semantic score.
     */
    if (
      fileType === "image" &&
      (
        extractionStatus === "LOW_CONFIDENCE" ||
        (
          ocrConfidence !== null &&
          ocrConfidence < 50
        )
      )
    ) {
      return {
        success: true,

        textVerificationStatus:
          "OCR_TOO_UNRELIABLE",

        textSimilarityScore: null,

        textSimilarityPercentage: null,

        textSupportsActivity: false,

        textVerificationReason:
          "OCR confidence was too low for reliable semantic comparison"
      };
    }

    /*
     * Include the mapped indicator as context.
     *
     * The activity remains the main claim,
     * while the indicator provides additional
     * semantic meaning.
     */
    const activityContext = `
Activity claim:
${cleanedActivityText}

Mapped SDG indicator:
${indicatorCode} - ${indicatorDescription}
    `.trim();

    /*
     * Generate both vectors in one API call.
     */
    const embeddingResponse =
      await openai.embeddings.create({
        model:
          process.env.OPENAI_EMBEDDING_MODEL ||
          "text-embedding-3-small",

        input: [
          activityContext,
          cleanedEvidenceText
        ]
      });

    const activityEmbedding =
      embeddingResponse.data[0]?.embedding;

    const evidenceEmbedding =
      embeddingResponse.data[1]?.embedding;

    if (
      !activityEmbedding ||
      !evidenceEmbedding
    ) {
      throw new Error(
        "Embedding vectors were not returned"
      );
    }

    const rawSimilarity =
      cosineSimilarity(
        activityEmbedding,
        evidenceEmbedding
      );

    /*
     * Keep the stored value between 0 and 1.
     */
    const similarityScore =
      Math.max(
        0,
        Math.min(1, rawSimilarity)
      );

    const roundedScore =
      Number(
        similarityScore.toFixed(4)
      );

    const percentage =
      Math.round(
        similarityScore * 100
      );

    const textVerificationStatus =
      getTextVerificationStatus(
        similarityScore
      );

    const textSupportsActivity =
      similarityScore >= 0.55;

    let textVerificationReason;

    if (
      textVerificationStatus ===
      "TEXT_SUPPORTED"
    ) {
      textVerificationReason =
        "The extracted evidence text strongly supports the claimed activity";
    } else if (
      textVerificationStatus ===
      "TEXT_PARTIALLY_SUPPORTED"
    ) {
      textVerificationReason =
        "The extracted evidence text is related to the activity but does not fully confirm it";
    } else {
      textVerificationReason =
        "The extracted evidence text does not sufficiently support the claimed activity";
    }

    return {
      success: true,

      textVerificationStatus,

      textSimilarityScore:
        roundedScore,

      textSimilarityPercentage:
        percentage,

      textSupportsActivity,

      textVerificationReason
    };
  } catch (error) {
    console.error(
      "Evidence semantic verification failed:",
      error
    );

    return {
      success: false,

      textVerificationStatus:
        "TEXT_VERIFICATION_FAILED",

      textSimilarityScore: null,

      textSimilarityPercentage: null,

      textSupportsActivity: false,

      textVerificationReason:
        "Semantic evidence verification could not be completed",

      textVerificationError:
        error.message ||
        "Embedding comparison failed"
    };
  }
}

module.exports = {
  verifyEvidenceText,
  cosineSimilarity
};