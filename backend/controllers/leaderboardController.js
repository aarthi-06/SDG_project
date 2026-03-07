const { getDB } = require("../config/db");

async function getLeaderboard(req, res) {
  try {
    const db = getDB();
    const activitiesCollection = db.collection("activities");
    const indicatorsCollection = db.collection("indicators");

    const totalIndicators = await indicatorsCollection.countDocuments();

    if (totalIndicators === 0) {
      return res.status(200).json([]);
    }

    const leaderboard = await activitiesCollection.aggregate([
      {
        $group: {
          _id: "$villageCode",
          villageCode: { $first: "$villageCode" },
          villageName: { $first: "$villageName" },
          districtName: { $first: "$districtName" },
          blockName: { $first: "$blockName" },
          totalActivities: { $sum: 1 },
          uniqueIndicators: { $addToSet: "$matched_indicator_code" }
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
          uniqueIndicatorsCovered: { $size: "$uniqueIndicators" },
          score: {
            $divide: [{ $size: "$uniqueIndicators" }, totalIndicators]
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
    ]).toArray();

    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    return res.status(200).json(rankedLeaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
}

module.exports = { getLeaderboard };