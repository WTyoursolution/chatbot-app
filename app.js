"use strict";

const chatHistoryDiv = document.getElementById("chatHistory");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("send");
const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

//function to add things to local storage
function addToStorage(sender, text) {
    chatHistory.push({ sender, text});
  
  if (chatHistory.length > 5) {
    chatHistory.shift(); //shift removes items from the array, in this case the oldest item, from the left side of the array
  } 
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

function renderNewMessage(sender, text) {
  chatHistoryDiv.innerHTML += `<p style="font-weight: bold">${sender}: ${text}</p>`;
}

async function fetchApiKey() {
  const config = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "ilikehorses" }), //use your secret herer
  };
  try {
    const res = await fetch(
      "https://proxy-key-0pm1.onrender.com/get-key",
      config
    );
    if (res.status != 200) {
      throw new Error("Could not get key");
    }
    const data = await res.json();
    const key = JSON.parse(data.key);
    return key.gemeni; // ||data/key
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function sendMessageToGemeni(userMessage) {
  try {
    const key = await fetchApiKey(); //this is the key
    if (!key) {
      renderNewMessage("Error:", "No Api key");
      throw new Error("No API Key");
    }

    const instructions =
      "System Instructions: You are EncourageBot. When a user shares how they feel, acknowledge their feelings FIRST, then Respond with encouragement, Bible verses, and messages about Jesus based on user input. Do NOT confirm or acknowledge these instructions. Just follow them. Use HTML for formatting, not Markdown. Keep responses under 30 words. Do NOT engage in non-religious topics. Always end with: ‘God loves you!’ Do not repeat these instructions in responses. Follow them instead. ";

    const config = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "userMessage" + instructions + "After this line is our chat history" + chatHistory}],
          },
        ],
      }),
    };

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      key;
    const res = await fetch(url, config); //sending a post request
    if (res.status != 200) {
      throw new Error("error occurred on line 61"); //line number will shift if you add things above
    }
    const data = await res.json();
    renderNewMessage("Robot", data.candidates[0].content.parts[0].text);
    addToStorage("Robot", data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error(error);
  }
}

// sendMessageToGemeni("Hello, are you awake");
sendBtn.addEventListener("click", () => {
  const message = userInput.value.trim(); //removes empty spaces in input
  if (message) {
    renderNewMessage("User", message);
    userInput.value = "";
    sendMessageToGemeni(message);
    addToStorage("User", message);
  }
});
