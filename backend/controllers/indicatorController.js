
const { getDB } = require("../config/db");

async function getIndicators(req, res) {
  try {
    const db = getDB();

    const collection =
      db.collection("indicators");

    const indicators = await collection
      .find(
        {
          districtComputable: true,
        },
        {
          projection: {
            embedding: 0,
          },
        }
      )
      .sort({
        sdg_goal_number: 1,
        indicator_code: 1,
      })
      .toArray();

    return res.status(200).json(
      indicators
    );
  } catch (error) {
    console.error(
      "Error fetching indicators:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
}

module.exports = {
  getIndicators,
};