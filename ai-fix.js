const fs = require("fs");
const { execSync } = require("child_process");

const API_URL = "https://api.fuelix.ai/v1/chat/completions";
const API_KEY = process.env.FUELIX_API_KEY;

async function run() {
  let output = "";

  // 1. Run Playwright tests
  try {
    output = execSync("npx playwright test", { encoding: "utf-8" });
  } catch (err) {
    output = err.stdout?.toString() || err.message;
  }

  console.log("\n=== PLAYWRIGHT OUTPUT ===\n");
  console.log(output);

  // 2. Ask AI for structured fix (NO DIFFS)
  const payload = {
    model: "claude-sonnet-4-6",
    messages: [
      {
        role: "user",
        content: `
You are a QA self-healing engine.

Analyze the Playwright failure and return ONLY valid JSON.

STRICT FORMAT:

{
  "file": "tests/example.spec.ts",
  "replacements": [
    {
      "find": "old text or selector",
      "replace": "new text or selector"
    }
  ]
}

RULES:
- Output ONLY JSON
- No markdown
- No explanation
- No extra text

FAILURE:
${output}
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

  // 3. Extract AI response
  let raw = data?.choices?.[0]?.message?.content || "";

  console.log("\n=== RAW AI OUTPUT ===\n");
  console.log(raw);

  // 4. Parse JSON safely
  let result;
  try {
    result = JSON.parse(raw);
  } catch (e) {
    console.log("\n❌ AI did not return valid JSON. Aborting.");
    return;
  }

  console.log("\n=== PARSED RESULT ===\n", result);

  // 5. Validate structure
  if (!result.file || !result.replacements) {
    console.log("\n❌ Invalid AI structure. Aborting.");
    return;
  }

  // 6. Apply changes deterministically
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
  console.log("\n✔ File updated safely (no git diff needed)");

  try {
    // 7. Git automation
    const branchName = "ai-fix/run-1";

    try {
    // check if branch exists locally
    execSync(`git rev-parse --verify ${branchName}`, { stdio: "ignore" });

    console.log(`Branch ${branchName} exists, switching...`);
    execSync(`git checkout ${branchName}`, { stdio: "inherit" });

    } catch (e) {
    console.log(`Creating new branch: ${branchName}`);
    execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
    }

    execSync("git add .", { stdio: "inherit" });
    execSync('git commit -m "AI self-heal: Playwright fix (v2)"', {
      stdio: "inherit",
    });

    execSync("git push -u origin ai-fix/run-1", { stdio: "inherit" });

    console.log("\n🚀 AI self-healing completed");
    console.log("👉 PR:");
    console.log("https://github.com/JoeBau/reflect-ai-demo/pull/new/ai-fix/run-1");

  } catch (e) {
    console.log("\n⚠ Git error:", e.message);
  }
}

run();