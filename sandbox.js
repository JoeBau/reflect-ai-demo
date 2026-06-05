function sanitizeForAI(input) {
  if (!input) return "";

  return input
    // remove potential secrets
    .replace(/ak-[a-zA-Z0-9]+/g, "[REDACTED_API_KEY]")
    .replace(/Bearer\s+[a-zA-Z0-9\-\._~\+\/]+=*/g, "Bearer [REDACTED]")
    .replace(/FUELIX_API_KEY\s*=\s*.*/g, "FUELIX_API_KEY=[REDACTED]")
    // remove long env dumps
    .replace(/process\.env\.[A-Z0-9_]+/g, "[ENV_VAR]")
    .slice(0, 20000); // prevent token explosion
}

module.exports = { sanitizeForAI };