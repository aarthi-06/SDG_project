const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { findBestIndicator } = require("../services/vectorSearchService");

async function createActivity(req, res) {
  try {
    const db = getDB();
    const activitiesCollection = db.collection("activities");
    const panchayatsCollection = db.collection("panchayats");

    const { villageCode, activity_text, status, evidenceLink } = req.body;

    if (!villageCode || !activity_text) {
      return res.status(400).json({
        message: "villageCode and activity_text are required"
      });
    }

    const numericVillageCode = Number(villageCode);

    if (isNaN(numericVillageCode)) {
      return res.status(400).json({
        message: "Invalid villageCode"
      });
    }

    if (req.user.role === "panchayat_official") {
      const allowed = req.user.assignedPanchayats || [];
      if (!allowed.includes(numericVillageCode)) {
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

    const panchayat = await panchayatsCollection.findOne({
      villageCode: numericVillageCode
    });

    if (!panchayat) {
      return res.status(404).json({
        message: "Panchayat not found"
      });
    }

    const matchedIndicator = await findBestIndicator(activity_text);

    if (!matchedIndicator) {
      return res.status(404).json({
        message: "No matching indicator found"
      });
    }

    const activityDoc = {
      villageCode: numericVillageCode,
      villageName: panchayat.villageName,
      districtName: panchayat.districtName,
      blockName: panchayat.blockName,
      activity_text,
      status: status || "Completed",
      evidenceLink: evidenceLink || "",
      matched_indicator_code: matchedIndicator.indicator_code,
      matched_indicator_description: matchedIndicator.indicator_description,
      sdg_goal_number: matchedIndicator.sdg_goal_number,
      target_number: matchedIndicator.target_number,
      nodal_ministry: matchedIndicator.nodal_ministry,
      mapping_score: matchedIndicator.score,
      createdBy: req.user.username,
      createdByRole: req.user.role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await activitiesCollection.insertOne(activityDoc);

    return res.status(201).json({
      message: "Activity recorded successfully",
      activityId: result.insertedId,
      mappedIndicator: {
        indicator_code: matchedIndicator.indicator_code,
        indicator_description: matchedIndicator.indicator_description,
        sdg_goal_number: matchedIndicator.sdg_goal_number,
        score: matchedIndicator.score
      }
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return res.status(500).json({
      message: "Server error while creating activity"
    });
  }
}

async function getActivitiesByVillage(req, res) {
  try {
    const db = getDB();
    const activitiesCollection = db.collection("activities");

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

    const activities = await activitiesCollection
      .find({ villageCode })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
}

async function updateActivity(req, res) {
  try {
    const db = getDB();
    const activitiesCollection = db.collection("activities");

    const { activityId } = req.params;
    const { activity_text, status, evidenceLink } = req.body;

    if (!ObjectId.isValid(activityId)) {
      return res.status(400).json({
        message: "Invalid activityId"
      });
    }

    const existingActivity = await activitiesCollection.findOne({
      _id: new ObjectId(activityId)
    });

    if (!existingActivity) {
      return res.status(404).json({
        message: "Activity not found"
      });
    }

    if (req.user.role === "panchayat_official") {
      const allowed = req.user.assignedPanchayats || [];
      if (!allowed.includes(existingActivity.villageCode)) {
        return res.status(403).json({
          message: "Access denied for this activity"
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

    const updatedDoc = {
      activity_text: activity_text ?? existingActivity.activity_text,
      status: status ?? existingActivity.status,
      evidenceLink: evidenceLink ?? existingActivity.evidenceLink,
      updatedAt: new Date()
    };

    if (activity_text && activity_text !== existingActivity.activity_text) {
      const matchedIndicator = await findBestIndicator(activity_text);

      if (!matchedIndicator) {
        return res.status(404).json({
          message: "No matching indicator found"
        });
      }

      updatedDoc.matched_indicator_code = matchedIndicator.indicator_code;
      updatedDoc.matched_indicator_description = matchedIndicator.indicator_description;
      updatedDoc.sdg_goal_number = matchedIndicator.sdg_goal_number;
      updatedDoc.target_number = matchedIndicator.target_number;
      updatedDoc.nodal_ministry = matchedIndicator.nodal_ministry;
      updatedDoc.mapping_score = matchedIndicator.score;
    }

    await activitiesCollection.updateOne(
      { _id: new ObjectId(activityId) },
      { $set: updatedDoc }
    );

    return res.status(200).json({
      message: "Activity updated successfully"
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    return res.status(500).json({
      message: "Server error while updating activity"
    });
  }
}

async function deleteActivity(req, res) {
  try {
    const db = getDB();
    const activitiesCollection = db.collection("activities");

    const { activityId } = req.params;

    if (!ObjectId.isValid(activityId)) {
      return res.status(400).json({
        message: "Invalid activityId"
      });
    }

    const existingActivity = await activitiesCollection.findOne({
      _id: new ObjectId(activityId)
    });

    if (!existingActivity) {
      return res.status(404).json({
        message: "Activity not found"
      });
    }

    if (req.user.role === "panchayat_official") {
      const allowed = req.user.assignedPanchayats || [];
      if (!allowed.includes(existingActivity.villageCode)) {
        return res.status(403).json({
          message: "Access denied for this activity"
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

    await activitiesCollection.deleteOne({
      _id: new ObjectId(activityId)
    });

    return res.status(200).json({
      message: "Activity deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return res.status(500).json({
      message: "Server error while deleting activity"
    });
  }
}

module.exports = {
  createActivity,
  getActivitiesByVillage,
  updateActivity,
  deleteActivity
};