const { MongoClient } = require("mongodb");

let db;

async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);

  await client.connect();
  console.log("MongoDB Connected");

  db = client.db(process.env.DB_NAME);
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}

module.exports = { connectDB, getDB };