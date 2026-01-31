require("dotenv").config();
const { MongoClient } = require("mongodb");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  const db = client.db(process.env.DB_NAME);
  const col = db.collection("indicators");

  // ✅ Try different activities by changing this line
  const activityText =`
  Conducted health awareness program for school children and upgraded school facilities.”
  ` ;


  const queryVector = await getEmbedding(activityText);

  const results = await col
    .aggregate([
      {
        $vectorSearch: {
          index: "indicator_vector_index", // must match your Atlas index name
          path: "embedding",
          queryVector,
          numCandidates: 50,
          limit: 3,
        },
      },
      {
        $project: {
          _id: 0,
          indicator_code: 1,
          indicator_description: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ])
    .toArray();

  console.log("\nActivity:", activityText);
  console.log("Top matches:");
  console.table(results);

  await client.close();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
