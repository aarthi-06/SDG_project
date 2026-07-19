function getReviewStatus(score) {
  if (score >= 80) {
    return "AUTO_APPROVED";
  }

  if (score >= 50) {
    return "FLAGGED_FOR_REVIEW";
  }

  return "REJECTED";
}

function calculateOverallVerification(evidence = []) {
  const validScores = [];

  let verifiedEvidenceCount = 0;
  let flaggedEvidenceCount = 0;
  let rejectedEvidenceCount = 0;

  for (const item of evidence) {
    const evidenceScores = [];

    /*
     * Image vision score.
     */
    if (
      typeof item.verificationScore === "number"
    ) {
      evidenceScores.push(
        item.verificationScore
      );
    }

    /*
     * PDF/OCR semantic text score.
     */
    if (
      typeof item.textSimilarityPercentage ===
      "number"
    ) {
      evidenceScores.push(
        item.textSimilarityPercentage
      );
    }

    /*
     * Skip evidence that has no valid score.
     */
    if (evidenceScores.length === 0) {
      continue;
    }

    const evidenceFinalScore =
      Math.round(
        evidenceScores.reduce(
          (sum, score) => sum + score,
          0
        ) / evidenceScores.length
      );

    item.finalEvidenceScore =
      evidenceFinalScore;

    if (evidenceFinalScore >= 80) {
      item.finalEvidenceStatus =
        "VERIFIED";

      verifiedEvidenceCount++;
    } else if (
      evidenceFinalScore >= 50
    ) {
      item.finalEvidenceStatus =
        "PARTIALLY_VERIFIED";

      flaggedEvidenceCount++;
    } else {
      item.finalEvidenceStatus =
        "NOT_VERIFIED";

      rejectedEvidenceCount++;
    }

    validScores.push(
      evidenceFinalScore
    );
  }

  if (validScores.length === 0) {
    return {
      overallVerificationScore: 0,

      overallVerificationStatus:
        "INSUFFICIENT_EVIDENCE",

      reviewStatus:
        "REJECTED",

      overallVerificationSummary:
        "No usable evidence score was available",

      verifiedEvidenceCount,
      flaggedEvidenceCount,
      rejectedEvidenceCount,

      totalEvidenceCount:
        evidence.length,

      scoredEvidenceCount: 0,

      reuploadRequired: true
    };
  }

  const overallVerificationScore =
    Math.round(
      validScores.reduce(
        (sum, score) => sum + score,
        0
      ) / validScores.length
    );

  const reviewStatus =
    getReviewStatus(
      overallVerificationScore
    );

  let overallVerificationStatus;
  let overallVerificationSummary;
  let reuploadRequired = false;

  if (
    reviewStatus ===
    "AUTO_APPROVED"
  ) {
    overallVerificationStatus =
      "VERIFIED";

    overallVerificationSummary =
      "The submitted evidence strongly supports the claimed activity.";
  } else if (
    reviewStatus ===
    "FLAGGED_FOR_REVIEW"
  ) {
    overallVerificationStatus =
      "PARTIALLY_VERIFIED";

    overallVerificationSummary =
      "The evidence provides partial support and requires district collector review.";
  } else {
    overallVerificationStatus =
      "NOT_VERIFIED";

    overallVerificationSummary =
      "The submitted evidence does not sufficiently support the claimed activity.";

    reuploadRequired = true;
  }

  return {
    overallVerificationScore,
    overallVerificationStatus,
    reviewStatus,
    overallVerificationSummary,

    verifiedEvidenceCount,
    flaggedEvidenceCount,
    rejectedEvidenceCount,

    totalEvidenceCount:
      evidence.length,

    scoredEvidenceCount:
      validScores.length,

    reuploadRequired
  };
}

module.exports = {
  calculateOverallVerification
};