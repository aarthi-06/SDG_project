require("dotenv").config();

const {
  connectDB,
  closeDB,
} = require("../config/db");

const {
  generateEmbedding,
  EMBEDDING_MODEL,
} = require(
  "../services/embeddingService"
);

const DELAY_MS = 500;
const MAX_RETRIES = 3;

function delay(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

async function generateWithRetry(
  indicator,
  attempt = 1
) {
  try {
    return await generateEmbedding(
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

    await delay(1500 * attempt);

    return generateWithRetry(
      indicator,
      attempt + 1
    );
  }
}

async function generateAllEmbeddings() {
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
        districtComputable: true,
        $or: [
          {
            embeddingStatus: {
              $ne: "COMPLETED",
            },
          },
          {
            embedding: {
              $exists: false,
            },
          },
        ],
      })
      .sort({
        sdg_goal_number: 1,
        indicator_code: 1,
      })
      .toArray();

    console.log(
      `Indicators pending embeddings: ${indicators.length}`
    );

    let completed = 0;
    let failed = 0;

    for (const indicator of indicators) {
      try {
        console.log(
          `Generating embedding for ${indicator.indicator_code}`
        );

        const result =
          await generateWithRetry(
            indicator
          );

        await collection.updateOne(
          {
            _id: indicator._id,
          },
          {
            $set: {
              embedding:
                result.embedding,

              embeddingText:
                result.embeddingText,

              embeddingModel:
                result.embeddingModel,

              embeddingDimensions:
                result.embeddingDimensions,

              embeddingStatus:
                "COMPLETED",

              embeddingGeneratedAt:
                new Date(),

              embeddingError: null,

              updatedAt: new Date(),
            },
          }
        );

        completed++;

        console.log(
          `${indicator.indicator_code} → COMPLETED (${completed}/${indicators.length})`
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
              embeddingStatus:
                "FAILED",

              embeddingError:
                error.message,

              embeddingModel:
                EMBEDDING_MODEL,

              updatedAt: new Date(),
            },
          }
        );
      }

      await delay(DELAY_MS);
    }

    console.log(
      "\nEmbedding generation completed"
    );
    console.log("Completed:", completed);
    console.log("Failed:", failed);

    const storedCount =
      await collection.countDocuments({
        districtComputable: true,
        embeddingStatus: "COMPLETED",
      });

    const failedCount =
      await collection.countDocuments({
        districtComputable: true,
        embeddingStatus: "FAILED",
      });

    console.log(
      "Total embeddings stored:",
      storedCount
    );

    console.log(
      "Failed embeddings:",
      failedCount
    );
  } catch (error) {
    console.error(
      "Embedding process failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

generateAllEmbeddings();