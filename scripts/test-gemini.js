const fs = require('fs');
const path = require('path');

// 1. Read key from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.+)/);
if (!match) {
  console.error("Could not find GEMINI_API_KEY in .env.local");
  process.exit(1);
}
const key = match[1].trim();
console.log("Found Gemini key: ", key.substring(0, 10) + "...");

// 2. Perform test fetch call to Gemini 3 Flash Preview
async function runTest() {
  console.log("Sending query to gemini-3-flash-preview...");
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "You are 'AtomQuest AI Coach' at Atomberg Technologies. Say a short encouraging hello to employee Angela!" }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (Status ${response.status}): ${errText}`);
    }

    const data = await response.json();
    console.log("Raw Gemini API Response:", JSON.stringify(data, null, 2));
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("\n--- SUCCESS! RESPONSE FROM GEMINI 3 FLASH PREVIEW ---");
    console.log(text ? text.trim() : "Empty text returned");
    console.log("------------------------------------------------------\n");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

runTest();
