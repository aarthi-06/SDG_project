const { getDB } = require("../config/db");

async function getPanchayats(req, res) {
  try {
    const db = getDB();
    const collection = db.collection("panchayats");

    const search = req.query.search?.trim();

    let query = {};

    if (req.user.role === "admin") {
      query = {};
    } else if (req.user.role === "district_collector") {
      query = { districtName: req.user.district };
    } else if (req.user.role === "panchayat_official") {
      query = { villageCode: { $in: req.user.assignedPanchayats || [] } };
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    if (search) {
      query.villageName = { $regex: search, $options: "i" };
    }

    const panchayats = await collection
      .find(query)
      .sort({ villageName: 1 })
      .toArray();

    return res.status(200).json(panchayats);
  } catch (error) {
    console.error("Error fetching panchayats:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getSinglePanchayat(req, res) {
  try {
    const db = getDB();
    const collection = db.collection("panchayats");

    const villageCode = Number(req.params.villageCode);

    if (isNaN(villageCode)) {
      return res.status(400).json({ message: "Invalid village code" });
    }

    let query = { villageCode };

    if (req.user.role === "admin") {
      // no extra restriction
    } else if (req.user.role === "district_collector") {
      query.districtName = req.user.district;
    } else if (req.user.role === "panchayat_official") {
      const assigned = req.user.assignedPanchayats || [];

      if (!assigned.includes(villageCode)) {
        return res.status(403).json({ message: "Access denied for this panchayat" });
      }
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    const panchayat = await collection.findOne(query);

    if (!panchayat) {
      return res.status(404).json({ message: "Panchayat not found" });
    }

    return res.status(200).json(panchayat);
  } catch (error) {
    console.error("Error fetching single panchayat:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getPanchayats, getSinglePanchayat };