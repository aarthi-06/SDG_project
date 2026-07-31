/*

 * Converts the final overall score into the

 * activity-level review decision.

 */

function getReviewStatus(score) {

  if (score >= 80) {

    return "AUTO_APPROVED";

  }

 

  if (score >= 50) {

    return "FLAGGED_FOR_REVIEW";

  }

 

  return "REJECTED";

}

 

/*

 * Converts the geo-verification status into

 * a numeric score.

 *

 * Missing GPS metadata is intentionally ignored.

 * It does not reduce the evidence score.

 */

function getGeoVerificationScore(

  geoVerification

) {

  const status =

    geoVerification?.status;

 

  if (status === "MATCHED") {

    return 100;

  }

 

  if (status === "NEARBY") {

    return 80;

  }

 

  if (status === "MISMATCHED") {

    return 20;

  }

 

  /*

   * These cases are not scored:

   *

   * - NOT_AVAILABLE

   * - NOT_APPLICABLE

   * - PANCHAYAT_LOCATION_NOT_CONFIGURED

   * - ERROR

   *

   * They should not penalize genuine evidence.

   */

  return null;

}

 

/*

 * Converts AI-image detection status into

 * a score penalty.

 *

 * AI-image detection is not included as another

 * weighted verification component. Instead, it

 * reduces the evidence score after vision,

 * semantic-text, and geo scores are combined.

 *

 * Penalties:

 * - LIKELY_REAL: 0

 * - SUSPICIOUS: 15

 * - LIKELY_AI_GENERATED: 35

 *

 * Unavailable/error results do not reduce the score.

 */

function getAIImagePenalty(

  aiImageDetection

) {

  const status =

    aiImageDetection?.detectionStatus;

 

  if (status === "SUSPICIOUS") {

    return 15;

  }

 

  if (

    status ===

    "LIKELY_AI_GENERATED"

  ) {

    return 35;

  }

 

  return 0;

}

 

/*

 * Calculates a weighted evidence score.

 *

 * Default weights:

 * - AI vision verification: 45%

 * - Semantic text verification: 45%

 * - Geo-tag verification: 10%

 *

 * When one component is unavailable, the remaining

 * available weights are automatically normalized.

 *

 * Example:

 * If geo metadata is unavailable, vision and semantic

 * verification each effectively contribute 50%.

 *

 * After the weighted score is calculated, an

 * authenticity penalty is applied when Sightengine

 * marks an image as suspicious or likely AI-generated.

 */

function calculateWeightedEvidenceScore(

  item

) {

  const components = [];

 

  /*

   * AI vision verification.

   */

  if (

    typeof item.verificationScore ===

      "number" &&

    Number.isFinite(

      item.verificationScore

    )

  ) {

    components.push({

      name: "VISION",

      score:

        Math.min(

          100,

          Math.max(

            0,

            item.verificationScore

          )

        ),

      weight: 45

    });

  }

 

  /*

   * OCR/PDF semantic verification.

   */

  if (

    typeof item.textSimilarityPercentage ===

      "number" &&

    Number.isFinite(

      item.textSimilarityPercentage

    )

  ) {

    components.push({

      name: "SEMANTIC_TEXT",

      score:

        Math.min(

          100,

          Math.max(

            0,

            item.textSimilarityPercentage

          )

        ),

      weight: 45

    });

  }

 

  /*

   * Geo-tag verification.

   */

  const geoScore =

    getGeoVerificationScore(

      item.geoVerification

    );

 

  item.geoVerificationScore =

    geoScore;

 

  item.geoVerificationIncluded =

    typeof geoScore === "number";

 

  if (

    typeof geoScore === "number"

  ) {

    components.push({

      name: "GEO_LOCATION",

      score: geoScore,

      weight: 10

    });

  }

 

  /*

   * No usable verification component.

   */

  if (components.length === 0) {

    return {

      finalScore: null,

      baseScore: null,

      aiImagePenalty: 0,

      components: [],

      totalWeight: 0

    };

  }

 

  const totalWeight =

    components.reduce(

      (sum, component) =>

        sum + component.weight,

      0

    );

 

  const weightedTotal =

    components.reduce(

      (sum, component) =>

        sum +

        (

          component.score *

          component.weight

        ),

      0

    );

 

  const baseScore =

    Math.round(

      weightedTotal /

      totalWeight

    );

 

  const aiImagePenalty =

    getAIImagePenalty(

      item.aiImageDetection

    );

 

  const finalScore =

    Math.max(

      0,

      baseScore - aiImagePenalty

    );

 

  return {

    finalScore,

    baseScore,

    aiImagePenalty,

    components,

    totalWeight

  };

}

 

/*

 * Calculates:

 *

 * 1. Final score for every evidence item.

 * 2. Final verification status for every evidence item.

 * 3. Overall activity verification score.

 * 4. Automatic approval, collector review, or rejection.

 * 5. Collector-review override for likely AI-generated images.

 */

function calculateOverallVerification(

  evidence = []

) {

  const validScores = [];

 

  let verifiedEvidenceCount = 0;

  let flaggedEvidenceCount = 0;

  let rejectedEvidenceCount = 0;

 

  let suspiciousAIImageCount = 0;

  let likelyAIGeneratedImageCount = 0;

 

  for (const item of evidence) {

    const weightedResult =

      calculateWeightedEvidenceScore(

        item

      );

 

    /*

     * Store AI-image penalty information on

     * every evidence item for MongoDB and UI use.

     */

    item.baseEvidenceScore =

      weightedResult.baseScore;

 

    item.aiImagePenalty =

      weightedResult.aiImagePenalty;

 

    const aiDetectionStatus =

      item.aiImageDetection

        ?.detectionStatus;

 

    if (

      aiDetectionStatus ===

      "SUSPICIOUS"

    ) {

      suspiciousAIImageCount++;

    }

 

    if (

      aiDetectionStatus ===

      "LIKELY_AI_GENERATED"

    ) {

      likelyAIGeneratedImageCount++;

    }

 

    /*

     * Store a component-level breakdown.

     *

     * This is useful for the collector dashboard

     * and for future debugging.

     */

    item.verificationScoreBreakdown =

      weightedResult.components.map(

        (component) => ({

          component:

            component.name,

 

          score:

            component.score,

 

          configuredWeight:

            component.weight,

 

          effectiveWeightPercentage:

            weightedResult.totalWeight > 0

              ? Number(

                  (

                    (

                      component.weight /

                      weightedResult.totalWeight

                    ) *

                    100

                  ).toFixed(2)

                )

              : 0

        })

      );

 

    /*

     * Skip evidence that has no valid score.

     */

    if (

      typeof weightedResult.finalScore !==

      "number"

    ) {

      item.finalEvidenceScore =

        null;

 

      item.finalEvidenceStatus =

        "INSUFFICIENT_EVIDENCE";

 

      continue;

    }

 

    const evidenceFinalScore =

      weightedResult.finalScore;

 

    item.finalEvidenceScore =

      evidenceFinalScore;

 

    /*

     * A likely AI-generated image must not be

     * treated as fully verified even when its

     * weighted score remains high after penalty.

     */

    if (

      aiDetectionStatus ===

      "LIKELY_AI_GENERATED"

    ) {

      item.finalEvidenceStatus =

        "FLAGGED_AI_GENERATED";

 

      flaggedEvidenceCount++;

    } else if (

      evidenceFinalScore >= 80

    ) {

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

 

  /*

   * No evidence item had a usable score.

   */

  if (validScores.length === 0) {

    return {

      overallVerificationScore: 0,

 

      overallVerificationStatus:

        "INSUFFICIENT_EVIDENCE",

 

      reviewStatus:

        "REJECTED",

 

      overallVerificationSummary:

        "No usable evidence score was available.",

 

      verifiedEvidenceCount,

      flaggedEvidenceCount,

      rejectedEvidenceCount,

 

      suspiciousAIImageCount,

      likelyAIGeneratedImageCount,

 

      totalEvidenceCount:

        evidence.length,

 

      scoredEvidenceCount: 0,

 

      reuploadRequired: true

    };

  }

 

  /*

   * Average all scored evidence items.

   */

  const overallVerificationScore =

    Math.round(

      validScores.reduce(

        (sum, score) =>

          sum + score,

        0

      ) /

      validScores.length

    );

 

  let reviewStatus =

    getReviewStatus(

      overallVerificationScore

    );

 

  /*

   * Authenticity safety rule:

   *

   * An activity containing at least one image marked

   * LIKELY_AI_GENERATED must never be auto-approved.

   * It is sent to the district collector for review.

   *

   * A low overall score remains rejected.

   */

  if (

    likelyAIGeneratedImageCount > 0 &&

    reviewStatus === "AUTO_APPROVED"

  ) {

    reviewStatus =

      "FLAGGED_FOR_REVIEW";

  }

 

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

 

    if (

      likelyAIGeneratedImageCount > 0

    ) {

      overallVerificationSummary =

        "The evidence requires district collector review because at least one uploaded image was detected as likely AI-generated.";

    } else if (

      suspiciousAIImageCount > 0

    ) {

      overallVerificationSummary =

        "The evidence provides partial support and includes an image with suspicious synthetic-image signals. District collector review is required.";

    } else {

      overallVerificationSummary =

        "The evidence provides partial support and requires district collector review.";

    }

  } else {

    overallVerificationStatus =

      "NOT_VERIFIED";

 

    overallVerificationSummary =

      likelyAIGeneratedImageCount > 0

        ? "The submitted evidence does not sufficiently support the claimed activity, and at least one image was detected as likely AI-generated."

        : "The submitted evidence does not sufficiently support the claimed activity.";

 

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

 

    suspiciousAIImageCount,

    likelyAIGeneratedImageCount,

 

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