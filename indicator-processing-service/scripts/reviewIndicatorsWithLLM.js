require("dotenv").config();

const {
  connectDB,
  closeDB,
} = require("../config/db");

const {
  reviewIndicatorWithLLM,
  MODEL_NAME,
} = require(
  "../services/llmClassificationService"
);

const DELAY_MS = 1200;
const MAX_RETRIES = 3;

function delay(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

async function reviewWithRetry(
  indicator,
  attempt = 1
) {
  try {
    return await reviewIndicatorWithLLM(
      indicator
    );
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      throw error;
    }

    console.log(
      `Retrying ${indicator.indicator_code}, attempt ${
        attempt + 1
      }`
    );

    await delay(2000 * attempt);

    return reviewWithRetry(
      indicator,
      attempt + 1
    );
  }
}

async function reviewPendingIndicators() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is missing in .env"
      );
    }

    const db = await connectDB();

    const collection =
      db.collection("indicators");

    const indicators = await collection
      .find({
        classificationStatus:
          "REVIEW_REQUIRED",
      })
      .sort({
        sdg_goal_number: 1,
        indicator_code: 1,
      })
      .toArray();

    console.log(
      `Indicators pending LLM review: ${indicators.length}`
    );

    let completed = 0;
    let failed = 0;
    let computable = 0;
    let nonComputable = 0;

    for (const indicator of indicators) {
      try {
        console.log(
          `Reviewing ${indicator.indicator_code}`
        );

        const result =
          await reviewWithRetry(indicator);

        await collection.updateOne(
          {
            _id: indicator._id,
          },
          {
            $set: {
              districtComputable:
                result.districtComputable,

              classificationMethod:
                "LLM_ASSISTED",

              classificationStatus:
                "COMPLETED",

              llmClassificationReason:
                result.reason,

              requiredDistrictData:
                result.requiredDistrictData,

              possibleDistrictSources:
                result.possibleDistrictSources,

              llmConfidence:
                result.confidenceScore,

              llmModel: MODEL_NAME,

              llmReviewedAt: new Date(),

              classificationError: null,

              updatedAt: new Date(),
            },
          }
        );

        completed++;

        if (
          result.districtComputable === true
        ) {
          computable++;
        } else {
          nonComputable++;
        }

        console.log(
          `${indicator.indicator_code} → ${
            result.districtComputable
              ? "COMPUTABLE"
              : "NOT COMPUTABLE"
          } (${completed}/${indicators.length})`
        );
      } catch (error) {
        failed++;

        console.error(
          `Failed ${indicator.indicator_code}:`,
          error.message
        );

        await collection.updateOne(
          {
            _id: indicator._id,
          },
          {
            $set: {
              classificationStatus:
                "LLM_REVIEW_FAILED",

              classificationError:
                error.message,

              llmModel: MODEL_NAME,

              updatedAt: new Date(),
            },
          }
        );
      }

      await delay(DELAY_MS);
    }

    console.log(
      "\nLLM-assisted review completed"
    );
    console.log("Completed:", completed);
    console.log("Failed:", failed);
    console.log(
      "District computable:",
      computable
    );
    console.log(
      "Not district computable:",
      nonComputable
    );

    const totalCompleted =
      await collection.countDocuments({
        classificationStatus:
          "COMPLETED",
      });

    const remainingReview =
      await collection.countDocuments({
        classificationStatus:
          "REVIEW_REQUIRED",
      });

    console.log(
      "Total completed in collection:",
      totalCompleted
    );

    console.log(
      "Still awaiting review:",
      remainingReview
    );
  } catch (error) {
    console.error(
      "LLM review process failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

reviewPendingIndicators();