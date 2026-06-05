const fs = require("fs");
const { execSync } = require("child_process");

const API_URL = "https://api.fuelix.ai/v1/chat/completions";
const API_KEY = process.env.FUELIX_API_KEY;

// Run everything inside async function
async function run() {
  let output;

  try {
    output = execSync("npx playwright test", { encoding: "utf-8" });
  } catch (err) {
    output = err.stdout?.toString() || err.message;
  }

  console.log("=== PLAYWRIGHT OUTPUT ===");
  console.log(output);

  const payload = {
    model: "claude-sonnet-4-6",
    messages: [
      {
        role: "user",
        content: `
You are a QA self-healing agent.

Fix this Playwright failure:

${output}

Return ONLY a git diff for tests/example.spec.ts.
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

  console.log("=== AI RESPONSE ===");
  console.log(data);

  fs.writeFileSync(
    "fix.patch",
    data.choices?.[0]?.message?.content || ""
  );

  console.log("Patch saved to fix.patch");

    const { execSync } = require("child_process");
    // Apply Patch
    try {
    execSync("git apply fix.patch", { stdio: "inherit" });
    console.log("Patch applied successfully");
    } catch (e) {
    console.log("Patch apply failed:", e.message);
    }
    // git branch
    try {
    execSync("git checkout -b ai-fix/run-1", { stdio: "inherit" });
    } catch (e) {
    console.log("Branch already exists or error:", e.message);
    }
    // Commit
    try {
    execSync("git add .", { stdio: "inherit" });
    execSync('git commit -m "AI self-heal: Playwright fix"', { stdio: "inherit" });
    } catch (e) {
    console.log("Commit skipped:", e.message);
    }
    // Push
    try {
    execSync("git push -u origin ai-fix/run-1", { stdio: "inherit" });
    } catch (e) {
    console.log("Push failed:", e.message);
    }



}

run();