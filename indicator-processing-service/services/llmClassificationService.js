const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_NAME =
  process.env.CLASSIFICATION_MODEL ||
  "gpt-4.1-mini";

function buildPrompt(indicator) {
  return `
You are reviewing an SDG indicator that a rule-based classifier could not classify confidently.

Your task is to decide whether the indicator can be computed independently at the DISTRICT level in India.

District-computable means:
- the numerator and denominator can reasonably be obtained or aggregated for one district;
- the indicator can be calculated using district administrative records, surveys, local institutions, facility records, census data, or state systems containing district-level data;
- the indicator does not depend only on national legislation, national accounts, international commitments, foreign flows, national policy adoption, or country-level reporting.

Indicator details:

Indicator code:
${indicator.indicator_code}

Indicator description:
${indicator.indicator_description}

Target description:
${indicator.target_description}

Official data source:
${indicator.nodal_ministry}

Periodicity:
${indicator.periodicity}

Rule-based reason:
${indicator.classificationReason}

Matched rule keywords:
${(indicator.matchedKeywords || []).join(", ") || "None"}

Return only JSON in this format:

{
  "districtComputable": true,
  "reason": "Brief and specific explanation",
  "requiredDistrictData": [
    "Required data item"
  ],
  "possibleDistrictSources": [
    "Possible district-level source"
  ],
  "confidenceScore": 0
}

Rules:
- districtComputable must be true or false.
- confidenceScore must be an integer from 0 to 100.
- Do not classify true merely because the indicator describes people, households, health, education or agriculture.
- Confirm that the complete indicator formula can reasonably be computed for a district.
- Keep the reason under 60 words.
`;
}

function cleanJsonText(text) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function validateResult(result, indicatorCode) {
  if (
    typeof result.districtComputable !==
    "boolean"
  ) {
    throw new Error(
      `Invalid districtComputable for ${indicatorCode}`
    );
  }

  if (
    typeof result.reason !== "string" ||
    !result.reason.trim()
  ) {
    throw new Error(
      `Missing reason for ${indicatorCode}`
    );
  }

  if (
    !Array.isArray(
      result.requiredDistrictData
    )
  ) {
    result.requiredDistrictData = [];
  }

  if (
    !Array.isArray(
      result.possibleDistrictSources
    )
  ) {
    result.possibleDistrictSources = [];
  }

  const confidenceScore = Number(
    result.confidenceScore
  );

  if (
    !Number.isInteger(confidenceScore) ||
    confidenceScore < 0 ||
    confidenceScore > 100
  ) {
    throw new Error(
      `Invalid confidenceScore for ${indicatorCode}`
    );
  }

  result.confidenceScore =
    confidenceScore;

  return result;
}

async function reviewIndicatorWithLLM(
  indicator
) {
  const response =
    await openai.responses.create({
      model: MODEL_NAME,
      input: buildPrompt(indicator),
    });

  if (!response.output_text) {
    throw new Error(
      `Empty LLM response for ${indicator.indicator_code}`
    );
  }

  let parsedResult;

  try {
    parsedResult = JSON.parse(
      cleanJsonText(response.output_text)
    );
  } catch {
    throw new Error(
      `Invalid JSON returned for ${indicator.indicator_code}`
    );
  }

  return validateResult(
    parsedResult,
    indicator.indicator_code
  );
}

module.exports = {
  reviewIndicatorWithLLM,
  MODEL_NAME,
};