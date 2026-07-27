const LOCAL_SERVICE_KEYWORDS = [
  "district",
  "village",
  "panchayat",
  "household",
  "households",
  "school",
  "schools",
  "hospital",
  "hospitals",
  "health centre",
  "health center",
  "primary health centre",
  "primary health center",
  "phc",
  "anganwadi",
  "road",
  "roads",
  "drinking water",
  "tap water",
  "sanitation",
  "toilet",
  "toilets",
  "waste management",
  "solid waste",
  "electricity",
  "housing",
  "population",
  "birth",
  "death",
  "maternal",
  "infant",
  "child",
  "students",
  "teachers",
  "agriculture",
  "farmers",
  "irrigation",
  "employment",
  "unemployment",
];

const LOCAL_DATA_SOURCE_KEYWORDS = [
  "district administration",
  "district health",
  "district education",
  "local body",
  "local bodies",
  "panchayat",
  "municipality",
  "municipal",
  "census",
  "health management information system",
  "hmis",
  "udise",
  "udise+",
  "rural development",
  "ministry of jal shakti",
  "drinking water and sanitation",
  "ministry of health and family welfare",
  "ministry of education",
  "ministry of rural development",
  "ministry of agriculture",
  "department of agriculture",
  "state government",
  "administrative records",
];

const NATIONAL_LEVEL_KEYWORDS = [
  "gross domestic product",
  "gdp",
  "gross national income",
  "gni",
  "foreign direct investment",
  "fdi",
  "national accounts",
  "national income",
  "balance of payments",
  "international trade",
  "exports",
  "imports",
  "parliament",
  "central government expenditure",
  "national budget",
  "national legislation",
  "international agreement",
  "international treaty",
  "global partnership",
  "official development assistance",
  "oda",
  "external debt",
  "remittances",
];

const POLICY_KEYWORDS = [
  "adopted legislation",
  "legislative framework",
  "national policy",
  "policy framework",
  "international framework",
  "international agreement",
  "legal framework",
  "whether the country has adopted",
  "country has adopted",
  "national strategy",
  "national action plan",
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function findMatches(text, keywords) {
  return keywords.filter((keyword) =>
    text.includes(keyword)
  );
}

function classifyIndicator(indicator) {
  const combinedText = normalizeText(
    [
      indicator.indicator_description,
      indicator.target_description,
      indicator.nodal_ministry,
    ].join(" ")
  );

  const localServiceMatches = findMatches(
    combinedText,
    LOCAL_SERVICE_KEYWORDS
  );

  const localDataSourceMatches = findMatches(
    combinedText,
    LOCAL_DATA_SOURCE_KEYWORDS
  );

  const nationalMatches = findMatches(
    combinedText,
    NATIONAL_LEVEL_KEYWORDS
  );

  const policyMatches = findMatches(
    combinedText,
    POLICY_KEYWORDS
  );

  /*
   * Rule 1:
   * Indicators depending clearly on national,
   * international, legal or policy-level measures
   * are not district-computable.
   */
  if (
    nationalMatches.length > 0 ||
    policyMatches.length > 0
  ) {
    return {
      districtComputable: false,
      classificationMethod: "RULE_BASED",
      classificationStatus: "COMPLETED",
      classificationReason:
        "The indicator depends mainly on national, international, legislative or macroeconomic data that cannot be computed independently at district level.",
      matchedRules: [
        ...(nationalMatches.length > 0
          ? ["NATIONAL_LEVEL_INDICATOR"]
          : []),
        ...(policyMatches.length > 0
          ? ["POLICY_OR_LEGISLATION_INDICATOR"]
          : []),
      ],
      matchedKeywords: [
        ...nationalMatches,
        ...policyMatches,
      ],
      ruleConfidence: "HIGH",
    };
  }

  /*
   * Rule 2:
   * Indicators referring to local services and
   * supported by local/administrative data sources
   * are district-computable.
   */
  if (
    localServiceMatches.length > 0 &&
    localDataSourceMatches.length > 0
  ) {
    return {
      districtComputable: true,
      classificationMethod: "RULE_BASED",
      classificationStatus: "COMPLETED",
      classificationReason:
        "The indicator measures a local service or population outcome and can reasonably be computed using district-level administrative data.",
      matchedRules: [
        "LOCAL_SERVICE_INDICATOR",
        "LOCAL_ADMINISTRATIVE_DATA_SOURCE",
      ],
      matchedKeywords: [
        ...localServiceMatches,
        ...localDataSourceMatches,
      ],
      ruleConfidence: "HIGH",
    };
  }

  /*
   * Rule 3:
   * Indicators with strong local-service keywords
   * but without a clearly local data source are
   * treated as likely computable.
   */
  if (localServiceMatches.length >= 2) {
    return {
      districtComputable: true,
      classificationMethod: "RULE_BASED",
      classificationStatus: "COMPLETED",
      classificationReason:
        "The indicator contains multiple local-level measurable concepts and is likely computable using district records.",
      matchedRules: [
        "MULTIPLE_LOCAL_MEASUREMENT_KEYWORDS",
      ],
      matchedKeywords: localServiceMatches,
      ruleConfidence: "MEDIUM",
    };
  }

  /*
   * Rule 4:
   * Indicators with only partial evidence are
   * sent for LLM-assisted review.
   */
  if (
    localServiceMatches.length === 1 ||
    localDataSourceMatches.length > 0
  ) {
    return {
      districtComputable: null,
      classificationMethod: "RULE_BASED",
      classificationStatus: "REVIEW_REQUIRED",
      classificationReason:
        "The indicator has some district-level characteristics, but the available rules are not sufficient for a confident decision.",
      matchedRules: [
        "PARTIAL_LOCAL_EVIDENCE",
      ],
      matchedKeywords: [
        ...localServiceMatches,
        ...localDataSourceMatches,
      ],
      ruleConfidence: "LOW",
    };
  }

  /*
   * Rule 5:
   * No reliable rule matched.
   */
  return {
    districtComputable: null,
    classificationMethod: "RULE_BASED",
    classificationStatus: "REVIEW_REQUIRED",
    classificationReason:
      "No rule produced a sufficiently confident district-level classification.",
    matchedRules: [],
    matchedKeywords: [],
    ruleConfidence: "LOW",
  };
}

module.exports = {
  classifyIndicator,
};