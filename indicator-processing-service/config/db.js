const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("MongoDB connected");
  }

  return db;
}

async function closeDB() {
  await client.close();
}

module.exports = {
  connectDB,
  closeDB,
};