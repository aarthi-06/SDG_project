require("dotenv").config();

const {
  connectDB,
  closeDB,
} = require("../config/db");

const {
  classifyIndicator,
} = require("../services/classificationService");

async function classifyAllIndicators() {
  try {
    const db = await connectDB();

    const collection =
      db.collection("indicators");

    const indicators = await collection
      .find({
        classificationStatus: {
          $ne: "COMPLETED",
        },
      })
      .toArray();

    console.log(
      `Indicators pending classification: ${indicators.length}`
    );

    let completedCount = 0;
    let reviewRequiredCount = 0;
    let computableCount = 0;
    let nonComputableCount = 0;

    for (const indicator of indicators) {
      const result =
        classifyIndicator(indicator);

      await collection.updateOne(
        {
          _id: indicator._id,
        },
        {
          $set: {
            districtComputable:
              result.districtComputable,

            classificationMethod:
              result.classificationMethod,

            classificationStatus:
              result.classificationStatus,

            classificationReason:
              result.classificationReason,

            matchedRules:
              result.matchedRules,

            matchedKeywords:
              result.matchedKeywords,

            ruleConfidence:
              result.ruleConfidence,

            classifiedAt: new Date(),

            updatedAt: new Date(),
          },
        }
      );

      if (
        result.classificationStatus ===
        "COMPLETED"
      ) {
        completedCount++;
      }

      if (
        result.classificationStatus ===
        "REVIEW_REQUIRED"
      ) {
        reviewRequiredCount++;
      }

      if (
        result.districtComputable === true
      ) {
        computableCount++;
      }

      if (
        result.districtComputable === false
      ) {
        nonComputableCount++;
      }

      console.log(
        `${indicator.indicator_code} → ${result.classificationStatus}`
      );
    }

    console.log("\nClassification completed");
    console.log(
      "Rule-based completed:",
      completedCount
    );
    console.log(
      "Review required:",
      reviewRequiredCount
    );
    console.log(
      "District computable:",
      computableCount
    );
    console.log(
      "Not district computable:",
      nonComputableCount
    );
  } catch (error) {
    console.error(
      "Classification failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

classifyAllIndicators();