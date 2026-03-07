const OpenAI = require("openai");
const { getDB } = require("../config/db");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });

  return response.data[0].embedding;
}

async function findBestIndicator(activityText) {
  const db = getDB();
  const indicatorsCollection = db.collection("indicators");

  const queryVector = await getEmbedding(activityText);

  const results = await indicatorsCollection.aggregate([
    {
      $vectorSearch: {
        index: "indicator_vector_index",
        path: "embedding",
        queryVector,
        numCandidates: 50,
        limit: 1
      }
    },
    {
      $project: {
        _id: 0,
        indicator_code: 1,
        indicator_description: 1,
        sdg_goal_number: 1,
        target_number: 1,
        nodal_ministry: 1,
        score: { $meta: "vectorSearchScore" }
      }
    }
  ]).toArray();

  return results[0] || null;
}

module.exports = { findBestIndicator };