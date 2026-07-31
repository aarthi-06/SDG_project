const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");


function getBaseUrl(req) {
  const configuredUrl =
    process.env.PUBLIC_BACKEND_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  const forwardedProtocol =
    req.get("x-forwarded-proto");

  const forwardedHost =
    req.get("x-forwarded-host");

  const protocol = forwardedProtocol
    ? forwardedProtocol.split(",")[0].trim()
    : req.protocol;

  const host = forwardedHost
    ? forwardedHost.split(",")[0].trim()
    : req.get("host");

  return `${protocol}://${host}`.replace(
    /\/+$/,
    ""
  );
}

/**
 * Converts a stored evidence path into a browser-accessible URL.
 */
function buildEvidenceUrl(req, filePath) {
  if (
    !filePath ||
    typeof filePath !== "string"
  ) {
    return null;
  }

  /*
   * If the database already contains a full URL,
   * return it without modifying it.
   */
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    return filePath;
  }

  const normalizedPath = filePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  return `${getBaseUrl(req)}/${normalizedPath}`;
}

/**
 * Get all activities waiting for collector review.
 *
 * District collectors:
 * - Can only see flagged activities from their district.
 *
 * Admins:
 * - Can see flagged activities from all districts.
 */
async function getFlaggedActivities(req, res) {
  try {
    const { role, district } = req.user;

    if (
      role !== "district_collector" &&
      role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Only district collectors or admins can view flagged activities"
      });
    }

    const db = getDB();

    const activitiesCollection =
  db.collection("activities");

const notificationsCollection =
  db.collection("notifications");

    const query = {
      reviewStatus: "FLAGGED_FOR_REVIEW"
    };

    /*
     * Restrict district collectors
     * to their assigned district.
     */
    if (role === "district_collector") {
      if (!district) {
        return res.status(403).json({
          message:
            "Collector district information is missing"
        });
      }

      query.districtName = district;
    }

    const activities =
      await activitiesCollection
        .find(query)
        .sort({
          createdAt: -1
        })
        .project({
          activity_embedding: 0,
          embedding: 0,
          "evidence.embedding": 0
        })
        .toArray();

    const formattedActivities =
      activities.map((activity) => {
        const formattedEvidence =
          Array.isArray(activity.evidence)
            ? activity.evidence.map(
                (item) => ({
                  originalName:
                    item.originalName,

                  fileType:
                    item.fileType,

                  mimeType:
                    item.mimeType,

                  fileSize:
                    item.fileSize,

                  fileUrl:
                    buildEvidenceUrl(
                      req,
                      item.filePath
                    ),

                  extractionStatus:
                    item.extractionStatus,

                  pageCount:
                    item.pageCount,

                  ocrConfidence:
                    item.ocrConfidence,

                  verificationStatus:
                    item.verificationStatus,

                  verificationScore:
                    item.verificationScore,

                  verificationSummary:
                    item.verificationSummary,

                  visibleElements:
                    item.visibleElements || [],

                  supportingReasons:
                    item.supportingReasons || [],

                  verificationLimitations:
                    item.verificationLimitations ||
                    [],

                  suspectedActivity:
                    item.suspectedActivity,

                  imageQuality:
                    item.imageQuality,

                    aiImageDetection:
  item.aiImageDetection || {
    detectionStatus:
      item.fileType === "image"
        ? "NOT_ANALYSED"
        : "NOT_APPLICABLE",

    aiGeneratedProbability: null,
    confidence: null,
    provider: null,
    reason: null,
    error: null
  },

                  textVerificationStatus:
                    item.textVerificationStatus,

                  textSimilarityScore:
                    item.textSimilarityScore,

                  textSimilarityPercentage:
                    item.textSimilarityPercentage,

                  textSupportsActivity:
                    item.textSupportsActivity,

                  textVerificationReason:
                    item.textVerificationReason,

                  finalEvidenceScore:
                    item.finalEvidenceScore,

                  finalEvidenceStatus:
                    item.finalEvidenceStatus,

                  uploadedAt:
                    item.uploadedAt
                })
              )
            : [];

        return {
          _id:
            activity._id,

          villageCode:
            activity.villageCode,

          villageName:
            activity.villageName,

          districtName:
            activity.districtName,

          blockName:
            activity.blockName,

          activity_text:
            activity.activity_text,

          status:
            activity.status,

          matched_indicator_code:
            activity.matched_indicator_code,

          matched_indicator_description:
            activity.matched_indicator_description,

          sdg_goal_number:
            activity.sdg_goal_number,

          target_number:
            activity.target_number,

          nodal_ministry:
            activity.nodal_ministry,

          mapping_score:
            activity.mapping_score,

          overallVerificationScore:
            activity.overallVerificationScore,

          overallVerificationStatus:
            activity.overallVerificationStatus,

          overallVerificationSummary:
            activity.overallVerificationSummary,

          reviewStatus:
            activity.reviewStatus,

          verifiedEvidenceCount:
            activity.verifiedEvidenceCount,

          flaggedEvidenceCount:
            activity.flaggedEvidenceCount,

          rejectedEvidenceCount:
            activity.rejectedEvidenceCount,

          totalEvidenceCount:
            activity.totalEvidenceCount,

          scoredEvidenceCount:
            activity.scoredEvidenceCount,

          collectorDecision:
            activity.collectorDecision,

          collectorRemarks:
            activity.collectorRemarks,

          reviewedBy:
            activity.reviewedBy,

          reviewedAt:
            activity.reviewedAt,

          createdBy:
            activity.createdBy,

          createdByRole:
            activity.createdByRole,

          createdAt:
            activity.createdAt,

          updatedAt:
            activity.updatedAt,

          evidence:
            formattedEvidence
        };
      });

    return res.status(200).json({
      message:
        "Flagged activities fetched successfully",

      count:
        formattedActivities.length,

      activities:
        formattedActivities
    });
  } catch (error) {
    console.error(
      "Get flagged activities error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while fetching flagged activities",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined
    });
  }
}

/**
 * Approve or reject a flagged activity.
 */
async function reviewFlaggedActivity(
  req,
  res
) {
  try {
    const {
      role,
      district,
      username
    } = req.user;

    const { activityId } = req.params;

    const {
      decision,
      remarks
    } = req.body;

    if (
      role !== "district_collector" &&
      role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Only district collectors or admins can review flagged activities"
      });
    }

    if (!ObjectId.isValid(activityId)) {
      return res.status(400).json({
        message:
          "Invalid activity ID"
      });
    }

    const normalizedDecision =
      decision?.trim().toUpperCase();

    if (
      normalizedDecision !== "APPROVED" &&
      normalizedDecision !== "REJECTED"
    ) {
      return res.status(400).json({
        message:
          "Decision must be either APPROVED or REJECTED"
      });
    }

    if (
      !remarks ||
      typeof remarks !== "string" ||
      remarks.trim().length < 5
    ) {
      return res.status(400).json({
        message:
          "Collector remarks are required and must contain at least 5 characters"
      });
    }

    const db = getDB();

    const activitiesCollection =
      db.collection("activities");

    const query = {
      _id:
        new ObjectId(activityId),

      reviewStatus:
        "FLAGGED_FOR_REVIEW",

      collectorDecision:
        "PENDING"
    };

    if (role === "district_collector") {
      if (!district) {
        return res.status(403).json({
          message:
            "Collector district information is missing"
        });
      }

      query.districtName = district;
    }

    const activity =
      await activitiesCollection.findOne(
        query
      );

    if (!activity) {
      return res.status(404).json({
        message:
          "Flagged activity not found, already reviewed, or outside your district"
      });
    }

    const newReviewStatus =
      normalizedDecision === "APPROVED"
        ? "COLLECTOR_APPROVED"
        : "COLLECTOR_REJECTED";

    const reviewedAt = new Date();

    const updateResult =
      await activitiesCollection.updateOne(
        query,
        {
          $set: {
            reviewStatus:
              newReviewStatus,

            collectorDecision:
              normalizedDecision,

            collectorRemarks:
              remarks.trim(),

            reviewedBy:
              username ||
              "unknown_collector",

            reviewedAt,

            updatedAt:
              reviewedAt
          }
        }
      );

    if (
      updateResult.modifiedCount === 0
    ) {
      return res.status(409).json({
        message:
          "The activity could not be reviewed because its status may have changed"
      });
    }



    /*
 * Create a notification for the
 * Panchayat Official.
 */
if (
  activity.createdBy &&
  activity.createdByRole ===
    "panchayat_official"
) {
  const notificationTitle =
    normalizedDecision === "APPROVED"
      ? "Activity Approved"
      : "Activity Rejected";

      const notificationsCollection =
  db.collection("notifications");

  const notificationMessage =
    normalizedDecision === "APPROVED"
      ? `Your activity "${activity.activity_text}" has been approved by the District Collector.`
      : `Your activity "${activity.activity_text}" has been rejected by the District Collector.`;

  await notificationsCollection.updateOne(
    {
      activityId: activity._id,
      recipientUsername:
        activity.createdBy,
      type: "COLLECTOR_DECISION"
    },
    {
      $setOnInsert: {
        activityId: activity._id,

        recipientUsername:
          activity.createdBy,

        recipientRole:
          activity.createdByRole,

        villageCode:
          activity.villageCode,

        villageName:
          activity.villageName,

        title:
          notificationTitle,

        message:
          notificationMessage,

        decision:
          normalizedDecision,

        collectorRemarks:
          remarks.trim(),

        reviewedBy:
          username ||
          "unknown_collector",

        type:
          "COLLECTOR_DECISION",

        isRead: false,

        createdAt:
          reviewedAt,

        readAt: null
      }
    },
    {
      upsert: true
    }
  );
}

    return res.status(200).json({
      message:
        normalizedDecision === "APPROVED"
          ? "Activity approved successfully"
          : "Activity rejected successfully",

      activityId,

      reviewStatus:
        newReviewStatus,

      collectorDecision:
        normalizedDecision,

      collectorRemarks:
        remarks.trim(),

      reviewedBy:
        username ||
        "unknown_collector",

      reviewedAt
    });
  } catch (error) {
    console.error(
      "Review flagged activity error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while reviewing flagged activity",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined
    });
  }
}

/**
 * Get activities already reviewed
 * by a collector.
 */
async function getReviewedActivities(
  req,
  res
) {
  try {
    const {
      role,
      district
    } = req.user;

    if (
      role !== "district_collector" &&
      role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Only district collectors or admins can view reviewed activities"
      });
    }

    const db = getDB();

    const activitiesCollection =
      db.collection("activities");

    const query = {
      reviewStatus: {
        $in: [
          "COLLECTOR_APPROVED",
          "COLLECTOR_REJECTED"
        ]
      }
    };

    if (role === "district_collector") {
      if (!district) {
        return res.status(403).json({
          message:
            "Collector district information is missing"
        });
      }

      query.districtName = district;
    }

    const activities =
      await activitiesCollection
        .find(query)
        .sort({
          reviewedAt: -1
        })
        .project({
          activity_embedding: 0,
          embedding: 0,
          "evidence.extractedText": 0,
          "evidence.fileHash": 0
        })
        .toArray();

    const formattedActivities =
      activities.map((activity) => ({
        ...activity,

        evidence:
          Array.isArray(activity.evidence)
            ? activity.evidence.map(
                (item) => ({
                  originalName:
                    item.originalName,

                  fileType:
                    item.fileType,

                  mimeType:
                    item.mimeType,

                  fileSize:
                    item.fileSize,

                  fileUrl:
                    buildEvidenceUrl(
                      req,
                      item.filePath
                    ),

                  extractionStatus:
                    item.extractionStatus,

                  pageCount:
                    item.pageCount,

                  ocrConfidence:
                    item.ocrConfidence,

                  verificationStatus:
                    item.verificationStatus,

                  verificationScore:
                    item.verificationScore,

                  verificationSummary:
                    item.verificationSummary,

                  visibleElements:
                    item.visibleElements || [],

                  supportingReasons:
                    item.supportingReasons || [],

                  verificationLimitations:
                    item.verificationLimitations ||
                    [],

                  suspectedActivity:
                    item.suspectedActivity,

                  imageQuality:
                    item.imageQuality,

                    aiImageDetection:
  item.aiImageDetection || {
    detectionStatus:
      item.fileType === "image"
        ? "NOT_ANALYSED"
        : "NOT_APPLICABLE",

    aiGeneratedProbability: null,
    confidence: null,
    provider: null,
    reason: null,
    error: null
  },

                  textVerificationStatus:
                    item.textVerificationStatus,

                  textSimilarityScore:
                    item.textSimilarityScore,

                  textSimilarityPercentage:
                    item.textSimilarityPercentage,

                  textSupportsActivity:
                    item.textSupportsActivity,

                  textVerificationReason:
                    item.textVerificationReason,

                  finalEvidenceScore:
                    item.finalEvidenceScore,

                  finalEvidenceStatus:
                    item.finalEvidenceStatus,

                  uploadedAt:
                    item.uploadedAt
                })
              )
            : []
      }));

    return res.status(200).json({
      message:
        "Reviewed activities fetched successfully",

      count:
        formattedActivities.length,

      activities:
        formattedActivities
    });
  } catch (error) {
    console.error(
      "Get reviewed activities error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while fetching reviewed activities",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined
    });
  }
}

module.exports = {
  getFlaggedActivities,
  reviewFlaggedActivity,
  getReviewedActivities
};