const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

/*
 * Converts Sightengine's AI-generation score
 * into a simple project-level status.
 */
function getDetectionStatus(aiGeneratedScore) {
  if (aiGeneratedScore >= 0.75) {
    return "LIKELY_AI_GENERATED";
  }

  if (aiGeneratedScore >= 0.4) {
    return "SUSPICIOUS";
  }

  return "LIKELY_REAL";
}

/*
 * Creates a human-readable explanation.
 */
function getDetectionReason(status, percentage) {
  if (status === "LIKELY_AI_GENERATED") {
    return `The detector found a strong AI-generation signal (${percentage}%).`;
  }

  if (status === "SUSPICIOUS") {
    return `The image contains some synthetic-image patterns (${percentage}%).`;
  }

  return `No strong AI-generation signal was detected (${percentage}%).`;
}

/*
 * Detect whether an uploaded image is likely
 * to have been generated using AI.
 */
async function detectAIImage(filePath) {
  if (!filePath) {
    return {
      detectionStatus: "NOT_ANALYSED",
      aiGeneratedProbability: null,
      confidence: null,
      provider: "SIGHTENGINE",
      reason: "No image path was provided.",
      error: null
    };
  }

  if (!fs.existsSync(filePath)) {
    return {
      detectionStatus: "ERROR",
      aiGeneratedProbability: null,
      confidence: null,
      provider: "SIGHTENGINE",
      reason: "The uploaded image could not be found.",
      error: "FILE_NOT_FOUND"
    };
  }

  const apiUser =
    process.env.SIGHTENGINE_API_USER;

  const apiSecret =
    process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret) {
    return {
      detectionStatus: "ERROR",
      aiGeneratedProbability: null,
      confidence: null,
      provider: "SIGHTENGINE",
      reason:
        "Sightengine API credentials are not configured.",
      error: "MISSING_API_CREDENTIALS"
    };
  }

  try {
    const formData = new FormData();

    formData.append(
      "media",
      fs.createReadStream(filePath)
    );

    formData.append(
      "models",
      "genai"
    );

    formData.append(
      "api_user",
      apiUser
    );

    formData.append(
      "api_secret",
      apiSecret
    );

    const response = await axios.post(
      "https://api.sightengine.com/1.0/check.json",
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },

        timeout: 30000,

        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const result = response.data;

    if (result?.status !== "success") {
      return {
        detectionStatus: "ERROR",
        aiGeneratedProbability: null,
        confidence: null,
        provider: "SIGHTENGINE",
        reason:
          result?.error?.message ||
          "Sightengine could not analyse the image.",
        error:
          result?.error?.code ||
          "SIGHTENGINE_ERROR"
      };
    }

    /*
     * Sightengine returns the probability that
     * the image is AI-generated as a value
     * between 0 and 1.
     */
    const rawScore =
      result?.type?.ai_generated;

    if (
      typeof rawScore !== "number" ||
      !Number.isFinite(rawScore)
    ) {
      return {
        detectionStatus: "ERROR",
        aiGeneratedProbability: null,
        confidence: null,
        provider: "SIGHTENGINE",
        reason:
          "The API response did not include an AI-generation score.",
        error: "MISSING_AI_SCORE"
      };
    }

    const aiGeneratedProbability =
      Math.round(rawScore * 100);

    const detectionStatus =
      getDetectionStatus(rawScore);

    return {
      detectionStatus,

      aiGeneratedProbability,

      confidence:
        Math.round(
          Math.max(
            rawScore,
            1 - rawScore
          ) * 100
        ),

      provider: "SIGHTENGINE",

      reason:
        getDetectionReason(
          detectionStatus,
          aiGeneratedProbability
        ),

      error: null
    };
  } catch (error) {
    console.error(
      "AI image detection failed:",
      error.response?.data ||
      error.message
    );

    return {
      detectionStatus: "ERROR",
      aiGeneratedProbability: null,
      confidence: null,
      provider: "SIGHTENGINE",
      reason:
        "AI-image detection could not be completed.",
      error:
        error.response?.data?.error?.message ||
        error.message
    };
  }
}

module.exports = {
  detectAIImage
};