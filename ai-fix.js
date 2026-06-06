const fs = require("fs");
const { execSync } = require("child_process");
const { sanitizeForAI } = require("./sandbox");

const API_URL = "https://api.fuelix.ai/v1/chat/completions";
const API_KEY = process.env.FUELIX_API_KEY;

async function run() {
  let rawOutput = "";
  let errorContext = "";

  // 1. Run Playwright safely
  try {
    rawOutput = execSync("npx playwright test", { encoding: "utf-8" });
  } catch (err) {
    rawOutput = err.stdout?.toString() || err.message;
  }

    try {
    const contextPathMatch = rawOutput.match(
        /Error Context:\s*(.+error-context\.md)/i
    );

    if (contextPathMatch) {
        const contextPath = contextPathMatch[1].trim();

        errorContext = fs.readFileSync(contextPath, "utf-8");

        console.log("\n=== ERROR CONTEXT ===\n");
        console.log(errorContext);
    }
    } catch (e) {
    console.log("No error context found");
    }  

  console.log("\n=== RAW PLAYWRIGHT OUTPUT ===\n");
  console.log(rawOutput);

  // 2. SANDBOX (security layer)
  const safeOutput = sanitizeForAI(rawOutput);

  // 3. Call AI
  const payload = {
    model: "claude-sonnet-4-6",
    messages: [
      {
        role: "user",
        content: `
You are a QA self-healing engine.

Return ONLY raw JSON. No markdown. No backticks.

Format:
{
  "file": "tests/example.spec.ts",
  "replacements": [
    {
      "find": "old text",
      "replace": "new text"
    }
  ]
}

Rules:
- Output must be valid JSON
- No explanations
- No extra text

Failure log:
${safeOutput}

Error Context:
${errorContext}
`
      }
    ]
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  // 4. Extract raw AI output
  let raw = data?.choices?.[0]?.message?.content || "";

  console.log("\n=== RAW AI OUTPUT ===\n");
  console.log(raw);

  // 5. CLEAN markdown artifacts (IMPORTANT FIX)
  raw = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  console.log("\n=== CLEANED AI OUTPUT ===\n");
  console.log(raw);

  // 6. Parse JSON safely
  let result;

  try {
    result = JSON.parse(raw);
  } catch (e) {
    console.log("\n❌ JSON parse failed — skipping run");
    console.log(raw);
    return;
  }

  // 7. Validate structure
  if (!result.file || !Array.isArray(result.replacements)) {
    console.log("\n❌ Invalid AI structure — aborting");
    return;
  }

  console.log("\n=== PARSED RESULT ===\n", result);

  // 8. Apply changes safely
  let filePath = result.file;
  let fileContent = fs.readFileSync(filePath, "utf-8");

  for (const r of result.replacements) {
    if (!r.find || !r.replace) continue;

    console.log(`Applying: ${r.find} → ${r.replace}`);

    fileContent = fileContent.replace(
      new RegExp(r.find, "g"),
      r.replace
    );
  }

  fs.writeFileSync(filePath, fileContent);
  console.log("\n✔ File updated safely");
  console.log("\n🤖 AI fix generated successfully");

}

run();