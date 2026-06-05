const fs = require('fs');

const failure = JSON.parse(
  fs.readFileSync('./failure-package.json', 'utf-8')
);

// 👉 This is the prompt sent to Claude
const prompt = `
You are a senior QA automation engineer.

A Playwright test has failed due to a UI change.

Your job:
1. Identify why it failed
2. Detect UI change (e.g. button text change)
3. Propose a FIXED Playwright test
4. Return ONLY a git diff patch

---

TEST NAME:
${failure.testName}

ERROR:
${failure.error}

ARTIFACTS:
Trace: ${failure.artifacts.trace}
Screenshot: ${failure.artifacts.screenshot}
Video: ${failure.artifacts.video}

---

RULES:
- Do NOT change app code
- Only fix Playwright test code
- Prefer resilient selectors (getByRole, getByText regex)
- Output ONLY a git diff
`;

console.log("\n=== CLAUDE INPUT PROMPT ===\n");
console.log(prompt);