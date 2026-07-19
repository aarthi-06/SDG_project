const { getDB } = require("../config/db");
const {
  approvedActivityFilter
} = require("../utils/activityFilters");

async function getLeaderboard(req, res) {
  try {
    const db = getDB();

    const activitiesCollection =
      db.collection("activities");

    const indicatorsCollection =
      db.collection("indicators");

    const totalIndicators =
      await indicatorsCollection.countDocuments();

    if (totalIndicators === 0) {
      return res.status(200).json([]);
    }

    const leaderboard =
      await activitiesCollection
        .aggregate([
          {
            $match: {
              ...approvedActivityFilter,

              matched_indicator_code: {
                $nin: [null, ""]
              }
            }
          },

          {
            $group: {
              _id: "$villageCode",

              villageCode: {
                $first: "$villageCode"
              },

              villageName: {
                $first: "$villageName"
              },

              districtName: {
                $first: "$districtName"
              },

              blockName: {
                $first: "$blockName"
              },

              totalActivities: {
                $sum: 1
              },

              uniqueIndicators: {
                $addToSet:
                  "$matched_indicator_code"
              }
            }
          },

          {
            $project: {
              _id: 0,

              villageCode: 1,
              villageName: 1,
              districtName: 1,
              blockName: 1,
              totalActivities: 1,

              uniqueIndicatorsCovered: {
                $size: "$uniqueIndicators"
              },

              score: {
                $divide: [
                  {
                    $size: "$uniqueIndicators"
                  },
                  totalIndicators
                ]
              }
            }
          },

          {
            $sort: {
              score: -1,
              totalActivities: -1,
              villageName: 1
            }
          }
        ])
        .toArray();

    const rankedLeaderboard =
      leaderboard.map((item, index) => ({
        rank: index + 1,
        ...item
      }));

    return res
      .status(200)
      .json(rankedLeaderboard);
  } catch (error) {
    console.error(
      "Error fetching leaderboard:",
      error
    );

    return res.status(500).json({
      message: "Server error"
    });
  }
}

async function getLeaderboardDetails(req, res) {
  try {
    const db = getDB();

    const activitiesCollection =
      db.collection("activities");

    const indicatorsCollection =
      db.collection("indicators");

    const villageCode =
      Number(req.params.villageCode);

    if (Number.isNaN(villageCode)) {
      return res.status(400).json({
        message: "Invalid village code"
      });
    }

    const totalIndicators =
      await indicatorsCollection.countDocuments();

    /*
      Only approved activities are included.

      Included:
      - AUTO_APPROVED
      - COLLECTOR_APPROVED

      Excluded:
      - FLAGGED_FOR_REVIEW
      - COLLECTOR_REJECTED
      - REJECTED
    */
    const activities =
      await activitiesCollection
        .find({
          villageCode,
          ...approvedActivityFilter
        })
        .sort({
          createdAt: -1
        })
        .toArray();

    /*
      When there are no approved activities,
      all indicators are considered missing.
    */
    if (!activities.length) {
      const missingIndicators =
        await indicatorsCollection
          .find({})
          .project({
            _id: 0,
            indicator_code: 1,
            indicator_description: 1,
            sdg_goal_number: 1
          })
          .sort({
            sdg_goal_number: 1,
            indicator_code: 1
          })
          .toArray();

      return res.status(200).json({
        villageCode,
        villageName: "",
        districtName: "",
        blockName: "",

        totalActivities: 0,
        uniqueIndicatorsCovered: 0,
        score: 0,

        coveredIndicators: [],
        missingIndicators,
        sdgGoalsCovered: [],
        activities: [],

        insight:
          "No approved activities are currently available for this panchayat."
      });
    }

    const first = activities[0];

    /*
      Get all unique mapped indicator codes
      from approved activities.
    */
    const indicatorCodes = [
      ...new Set(
        activities
          .map(
            (item) =>
              item.matched_indicator_code
          )
          .filter(
            (code) =>
              code !== null &&
              code !== undefined &&
              code !== ""
          )
      )
    ];

    /*
      Fetch the indicators covered by
      approved activities.
    */
    const coveredIndicators =
      indicatorCodes.length > 0
        ? await indicatorsCollection
            .find({
              indicator_code: {
                $in: indicatorCodes
              }
            })
            .project({
              _id: 0,
              indicator_code: 1,
              indicator_description: 1,
              sdg_goal_number: 1
            })
            .sort({
              sdg_goal_number: 1,
              indicator_code: 1
            })
            .toArray()
        : [];

    /*
      Every indicator that is not covered
      becomes a missing indicator.
    */
    const missingIndicators =
      await indicatorsCollection
        .find({
          indicator_code: {
            $nin: indicatorCodes
          }
        })
        .project({
          _id: 0,
          indicator_code: 1,
          indicator_description: 1,
          sdg_goal_number: 1
        })
        .sort({
          sdg_goal_number: 1,
          indicator_code: 1
        })
        .toArray();

    /*
      Extract unique SDG goal numbers
      from covered indicators.
    */
    const sdgGoalsCovered = [
      ...new Set(
        coveredIndicators
          .map(
            (item) =>
              item.sdg_goal_number
          )
          .filter(
            (value) =>
              value !== null &&
              value !== undefined
          )
      )
    ].sort((a, b) => a - b);

    const uniqueIndicatorsCovered =
      indicatorCodes.length;

    const score =
      totalIndicators > 0
        ? uniqueIndicatorsCovered /
          totalIndicators
        : 0;

    let insight =
      "This panchayat has started activity mapping.";

    if (uniqueIndicatorsCovered >= 5) {
      insight =
        "Strong indicator coverage with good activity diversity.";
    } else if (
      uniqueIndicatorsCovered >= 3
    ) {
      insight =
        "Good progress with multiple indicators already covered.";
    } else if (
      uniqueIndicatorsCovered >= 1
    ) {
      insight =
        "Initial progress made, but more indicator coverage is needed.";
    }

    return res.status(200).json({
      villageCode,

      villageName:
        first.villageName || "",

      districtName:
        first.districtName || "",

      blockName:
        first.blockName || "",

      totalActivities:
        activities.length,

      uniqueIndicatorsCovered,

      score,

      scorePercentage:
        Number((score * 100).toFixed(2)),

      coveredIndicators,

      missingIndicators,

      sdgGoalsCovered,

      activities:
        activities.map((item) => ({
          _id: item._id,

          activity_text:
            item.activity_text || "",

          status:
            item.status || "Planned",

          matched_indicator_code:
            item.matched_indicator_code ||
            "",

          sdg_goal_number:
            item.sdg_goal_number ?? null,

          reviewStatus:
            item.reviewStatus || null,

          collectorDecision:
            item.collectorDecision || null,

          overallVerificationScore:
            item.overallVerificationScore ??
            null,

          overallVerificationStatus:
            item.overallVerificationStatus ||
            null,

          evidenceCount:
            Array.isArray(item.evidence)
              ? item.evidence.length
              : 0,

          createdAt:
            item.createdAt || null,

          updatedAt:
            item.updatedAt || null
        })),

      insight
    });
  } catch (error) {
    console.error(
      "Error fetching leaderboard details:",
      error
    );

    return res.status(500).json({
      message: "Server error"
    });
  }
}

module.exports = {
  getLeaderboard,
  getLeaderboardDetails
};