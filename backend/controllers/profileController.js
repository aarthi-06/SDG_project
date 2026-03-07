const { getDB } = require("../config/db");

async function getProfileByVillage(req, res) {
  try {
    const db = getDB();
    const profilesCollection = db.collection("panchayat_profiles");

    const villageCode = Number(req.params.villageCode);

    if (isNaN(villageCode)) {
      return res.status(400).json({
        message: "Invalid village code"
      });
    }

    if (req.user.role === "panchayat_official") {
      const allowed = req.user.assignedPanchayats || [];
      if (!allowed.includes(villageCode)) {
        return res.status(403).json({
          message: "Access denied for this panchayat"
        });
      }
    }

    const profile = await profilesCollection.findOne({ villageCode });

    if (!profile) {
      return res.status(200).json({
        message: "No profile found yet",
        profile: null
      });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
}

async function upsertProfile(req, res) {
  try {
    const db = getDB();
    const profilesCollection = db.collection("panchayat_profiles");
    const panchayatsCollection = db.collection("panchayats");

    const villageCode = Number(req.params.villageCode);

    if (isNaN(villageCode)) {
      return res.status(400).json({
        message: "Invalid village code"
      });
    }

    if (req.user.role === "panchayat_official") {
      const allowed = req.user.assignedPanchayats || [];
      if (!allowed.includes(villageCode)) {
        return res.status(403).json({
          message: "Access denied for this panchayat"
        });
      }
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "district_collector" &&
      req.user.role !== "panchayat_official"
    ) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const panchayat = await panchayatsCollection.findOne({ villageCode });

    if (!panchayat) {
      return res.status(404).json({
        message: "Panchayat not found"
      });
    }

    const {
      populationBand,
      areaTypeTags,
      topLocalProblems,
      phcAvailable,
      governmentSchoolAvailable,
      anganwadiAvailable,
      tapWaterCoverage,
      toiletCoverage
    } = req.body;

    const allowedPopulationBands = ["<2k", "2-5k", "5-10k", ">10k"];
    const allowedCoverage = ["Low", "Medium", "High"];

    if (populationBand && !allowedPopulationBands.includes(populationBand)) {
      return res.status(400).json({
        message: "Invalid populationBand"
      });
    }

    if (tapWaterCoverage && !allowedCoverage.includes(tapWaterCoverage)) {
      return res.status(400).json({
        message: "Invalid tapWaterCoverage"
      });
    }

    if (toiletCoverage && !allowedCoverage.includes(toiletCoverage)) {
      return res.status(400).json({
        message: "Invalid toiletCoverage"
      });
    }

    if (topLocalProblems && (!Array.isArray(topLocalProblems) || topLocalProblems.length > 3)) {
      return res.status(400).json({
        message: "topLocalProblems must be an array with maximum 3 items"
      });
    }

    const updateDoc = {
      villageCode,
      populationBand: populationBand || "",
      areaTypeTags: Array.isArray(areaTypeTags) ? areaTypeTags : [],
      topLocalProblems: Array.isArray(topLocalProblems) ? topLocalProblems : [],
      phcAvailable: Boolean(phcAvailable),
      governmentSchoolAvailable: Boolean(governmentSchoolAvailable),
      anganwadiAvailable: Boolean(anganwadiAvailable),
      tapWaterCoverage: tapWaterCoverage || "",
      toiletCoverage: toiletCoverage || "",
      updatedBy: req.user.username,
      updatedByRole: req.user.role,
      updatedAt: new Date()
    };

    await profilesCollection.updateOne(
      { villageCode },
      { $set: updateDoc },
      { upsert: true }
    );

    return res.status(200).json({
      message: "Profile saved successfully"
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
}

module.exports = { getProfileByVillage, upsertProfile };