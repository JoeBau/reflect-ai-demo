const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, '../results.json');

function safeReadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

const results = safeReadJSON(resultsPath);

if (!results) {
  console.log("No results.json found or invalid JSON");
  process.exit(1);
}

// Find failed test
let failedTest = null;

for (const suite of results.suites || []) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      if (test.results?.some(r => r.status === 'failed')) {
        failedTest = test;
        break;
      }
    }
  }
}

const package = {
  timestamp: new Date().toISOString(),

  testName: failedTest?.title || "unknown",

  error: failedTest?.results?.[0]?.error?.message || "unknown error",

  status: failedTest ? "failed" : "passed",

  artifacts: {
    trace: "test-results/trace.zip",
    screenshot: "test-results/test-failed-1.png",
    video: "test-results/video.webm"
  },

  rawResults: results
};

fs.writeFileSync(
  path.join(__dirname, '../failure-package.json'),
  JSON.stringify(package, null, 2)
);

console.log("Failure package created: failure-package.json");