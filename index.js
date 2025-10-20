const { Client } = require("discord.js-selfbot-v13"); // or your client lib

const API_KEY = process.env.api;

// ================== AI FUNCTION WITH CONTEXT ==================
async function askAI(prompt, memory = [], maxTokens = 200) {
  const contextText = memory.length > 0 ? memory.join("\n") + "\n" : "";
  const fullPrompt = contextText + "User: " + prompt + "\nYou (Gemini, a cute Virtual Assistant, 18, White Hair, Blue eyes):";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    }
  );
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

// ----------------- Winter -----------------
const winterClient = new Client({ checkUpdate: false, restRequestTimeout: 60000 });
let memory_winter = {};  // memory per user

winterClient.on("ready", () => {
  console.log(`✅ Winter logged in as ${winterClient.user.username}`);
});

winterClient.on("messageCreate", async (message) => {
  if (message.author.id === winterClient.user.id) return;

  const isPinged = message.mentions.users.has(winterClient.user.id);
  if (!isPinged) return;

  try {
    const channel = await winterClient.channels.fetch(message.channel.id);

    const prompt = message.content.replace(`<@${winterClient.user.id}>`, "").trim();
    if (!prompt) {
      return channel.send(`👋 <@${message.author.id}> You pinged me — what do you want?`);
    }

    // ✅ Setup memory
    if (!memory_winter[message.author.id]) {
      memory_winter[message.author.id] = [];
    }

    memory_winter[message.author.id].push(`User: ${prompt}`);
    if (memory_winter[message.author.id].length > 30) {
      memory_winter[message.author.id].shift();
    }
    channel.sendTyping();
    // ✅ Start typing indicator loop
    let typing = true;
    const typingLoop = setInterval(() => {
      if (typing) {
        channel.sendTyping();
      }
    }, 4000); // send typing every 2 seconds

    // ✅ Ask AI
    const aiResponse = await askAI(prompt, memory_winter[message.author.id], 200);

    typing = false;
    clearInterval(typingLoop);

    if (!aiResponse) {
      return channel.send(`❌ <@${message.author.id}> Couldn't think of a reply.`);
    }

    memory_winter[message.author.id].push(`AI: ${aiResponse}`);
    if (memory_winter[message.author.id].length > 30) {
      memory_winter[message.author.id].shift();
    }

    await channel.send(`<@${message.author.id}> ${aiResponse}`);

  } catch (err) {
    console.error("❌ Winter Bot Error:", err);
  }
});

winterClient.login(process.env.token);

const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
