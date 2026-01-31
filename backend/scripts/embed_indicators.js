require('dotenv').config();
const { MongoClient, ObjectId } = require("mongodb");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function embedText(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return res.data[0].embedding; // length 1536
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  const db = client.db(process.env.DB_NAME);
  const col = db.collection("indicators");

  const indicators = await col.find({ embedding: { $exists: false } }).toArray();
  console.log(`Found ${indicators.length} indicators without embeddings`);

  for (const ind of indicators) {
    const textForEmbedding =
      `${ind.indicator_code}: ${ind.indicator_description}. ` +
      `SDG ${ind.sdg_goal_number}, Target ${ind.target_number}. ` +
      `Nodal: ${ind.nodal_ministry}.`;

    const embedding = await embedText(textForEmbedding);

    await col.updateOne(
      { _id: new ObjectId(ind._id) },
      { $set: { embedding } }
    );

    console.log(`Embedded: ${ind.indicator_code}`);
  }

  await client.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
