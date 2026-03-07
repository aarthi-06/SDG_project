const { getDB } = require("../config/db");

async function getIndicators(req, res) {
  try {
    const db = getDB();
    const collection = db.collection("indicators");

    const indicators = await collection.find(
      {},
      {
        projection: {
          embedding: 0
        }
      }
    ).toArray();

    return res.status(200).json(indicators);
  } catch (error) {
    console.error("Error fetching indicators:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getIndicators };