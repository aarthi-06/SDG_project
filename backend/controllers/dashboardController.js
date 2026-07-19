const { getDB } = require("../config/db");
const {
  approvedActivityFilter
} = require("../utils/activityFilters");

async function getDashboardSummary(req, res) {
  try {
    const db = getDB();

    const activitiesCollection =
      db.collection("activities");

    const indicatorsCollection =
      db.collection("indicators");

    const role = req.user?.role;
    const district = req.user?.district;

    /*
      Admin:
      - sees all districts

      District collector:
      - sees only their assigned district
    */
    const accessFilter = {};

    if (role === "district_collector") {
      if (!district) {
        return res.status(403).json({
          message: "Collector district information is missing"
        });
      }

      accessFilter.districtName = district;
    }

    /*
      Count all activities according to review status.
    */
    const [
      totalActivities,
      autoApproved,
      collectorApproved,
      flaggedForReview,
      collectorRejected
    ] = await Promise.all([
      activitiesCollection.countDocuments({
        ...accessFilter
      }),

      activitiesCollection.countDocuments({
        ...accessFilter,
        reviewStatus: "AUTO_APPROVED"
      }),

      activitiesCollection.countDocuments({
        ...accessFilter,
        reviewStatus: "COLLECTOR_APPROVED"
      }),

      activitiesCollection.countDocuments({
        ...accessFilter,
        reviewStatus: "FLAGGED_FOR_REVIEW"
      }),

      activitiesCollection.countDocuments({
        ...accessFilter,
        reviewStatus: "COLLECTOR_REJECTED"
      })
    ]);

    /*
      Activities rejected before insertion are not present
      in the activities collection.

      So this remains 0 unless rejected activities are stored
      in this collection in the future.
    */
    const rejected = await activitiesCollection.countDocuments({
      ...accessFilter,
      reviewStatus: "REJECTED"
    });

    /*
      Total indicators available in the system.
    */
    const totalIndicators =
      await indicatorsCollection.countDocuments();

    /*
      Find unique indicators covered by approved activities.
    */
    const coveredIndicatorResult =
      await activitiesCollection
        .aggregate([
          {
            $match: {
              ...accessFilter,
              ...approvedActivityFilter,
              matched_indicator_code: {
                $nin: [null, ""]
              }
            }
          },
          {
            $group: {
              _id: null,
              indicators: {
                $addToSet: "$matched_indicator_code"
              }
            }
          },
          {
            $project: {
              _id: 0,
              totalIndicatorsCovered: {
                $size: "$indicators"
              }
            }
          }
        ])
        .toArray();

    const totalIndicatorsCovered =
      coveredIndicatorResult[0]?.totalIndicatorsCovered || 0;

    const coveragePercentage =
      totalIndicators > 0
        ? Number(
            (
              (totalIndicatorsCovered / totalIndicators) *
              100
            ).toFixed(2)
          )
        : 0;

    /*
      Get top panchayat using approved activities only.
    */
    const topPanchayatResult =
      await activitiesCollection
        .aggregate([
          {
            $match: {
              ...accessFilter,
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
                $addToSet: "$matched_indicator_code"
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
                $cond: [
                  {
                    $gt: [totalIndicators, 0]
                  },
                  {
                    $divide: [
                      {
                        $size: "$uniqueIndicators"
                      },
                      totalIndicators
                    ]
                  },
                  0
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
          },
          {
            $limit: 1
          }
        ])
        .toArray();

    const topPanchayat =
      topPanchayatResult.length > 0
        ? {
            ...topPanchayatResult[0],
            scorePercentage: Number(
              (
                topPanchayatResult[0].score * 100
              ).toFixed(2)
            )
          }
        : null;

    /*
      Approved activity count.
    */
    const approvedActivities =
      autoApproved + collectorApproved;

    return res.status(200).json({
      scope:
        role === "district_collector"
          ? {
              type: "DISTRICT",
              district
            }
          : {
              type: "ALL_DISTRICTS"
            },

      activitySummary: {
        totalActivities,
        approvedActivities,
        autoApproved,
        collectorApproved,
        flaggedForReview,
        collectorRejected,
        rejected
      },

      indicatorSummary: {
        totalIndicators,
        totalIndicatorsCovered,
        coveragePercentage
      },

      topPanchayat
    });
  } catch (error) {
    console.error(
      "Error fetching dashboard summary:",
      error
    );

    return res.status(500).json({
      message: "Server error while fetching dashboard summary"
    });
  }
}

module.exports = {
  getDashboardSummary
};