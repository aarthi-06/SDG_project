require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
  connectDB,
  closeDB,
} = require("../config/db");

async function importIndicators() {
  try {
    const filePath = path.join(
      __dirname,
      "../data/nif/nif-indicators-final-clean.json"
    );

    const fileContent = fs.readFileSync(
      filePath,
      "utf-8"
    );

    const parsedData = JSON.parse(fileContent);

    if (
      !parsedData.indicators ||
      !Array.isArray(parsedData.indicators)
    ) {
      throw new Error(
        "The JSON file does not contain an indicators array"
      );
    }

    const db = await connectDB();

    const indicatorsCollection =
      db.collection("indicators");

    await indicatorsCollection.createIndex(
      {
        indicator_code: 1,
      },
      {
        unique: true,
      }
    );

    await indicatorsCollection.createIndex({
      sdg_goal_number: 1,
    });

    await indicatorsCollection.createIndex({
      target_number: 1,
    });

    const operations = parsedData.indicators.map(
      (indicator) => ({
        updateOne: {
          filter: {
            indicator_code:
              indicator.indicator_code,
          },
          update: {
            $set: {
              ...indicator,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      })
    );

    const result =
      await indicatorsCollection.bulkWrite(
        operations
      );

    console.log("Import completed");
    console.log(
      "Matched:",
      result.matchedCount
    );
    console.log(
      "Modified:",
      result.modifiedCount
    );
    console.log(
      "Inserted:",
      result.upsertedCount
    );

    const total =
      await indicatorsCollection.countDocuments();

    console.log(
      "Total indicators in MongoDB:",
      total
    );
  } catch (error) {
    console.error(
      "Indicator import failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

importIndicators();