const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL ||
  "text-embedding-3-small";

function buildEmbeddingText(indicator) {
  return [
    `SDG ${indicator.sdg_goal_number}: ${indicator.sdg_goal_title}`,
    `Indicator ${indicator.indicator_code}: ${indicator.indicator_description}`,
    `Target ${indicator.target_number}: ${indicator.target_description}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateEmbedding(indicator) {
  const inputText =
    buildEmbeddingText(indicator);

  if (!inputText.trim()) {
    throw new Error(
      `Embedding text is empty for ${indicator.indicator_code}`
    );
  }

  const response =
    await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputText,
      encoding_format: "float",
    });

  const embedding =
    response.data?.[0]?.embedding;

  if (
    !Array.isArray(embedding) ||
    embedding.length === 0
  ) {
    throw new Error(
      `Invalid embedding returned for ${indicator.indicator_code}`
    );
  }

  return {
    embedding,
    embeddingText: inputText,
    embeddingModel: EMBEDDING_MODEL,
    embeddingDimensions:
      embedding.length,
  };
}

module.exports = {
  generateEmbedding,
  EMBEDDING_MODEL,
};