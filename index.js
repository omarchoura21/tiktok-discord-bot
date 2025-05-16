require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const cron = require('node-cron');
const express = require("express");
const fs = require('fs');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

const TOKEN = process.env.DISCORD_TOKEN;
const MAIN_TIKTOK = 'https://www.tiktok.com/@du_duruu/video/7362722874018286853';
const SEARCH_QUERY = 'unexpected edits zack d film';
const SENT_LOG_FILE = './sent_tiktoks.json';

const FRIEND_IDS = [
  '686652284696002560', // abdallah
  '203048947705446400', // kossay
  '837464580887281696', // ali
  '436559024788340746', // moez
  '543488162219950080', // ania
  '295190404842782721',// you
  '479422376703033356'  //yousef
];

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const sentDates = new Set();

cron.schedule('0 7 * * *', () => {
  const today = new Date().toDateString();

  if (sentDates.has(today)) {
    console.log('🕒 TikTok already sent today — skipping.');
    return;
  }

  console.log('📤 Sending daily TikTok link...');
  sendTikTokToFriends();
  sentDates.add(today);
});

});

// Load sent TikToks from file
function loadSentTiktoks() {
  if (!fs.existsSync(SENT_LOG_FILE)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(SENT_LOG_FILE, 'utf-8')));
}

// Save sent TikToks to file
function saveSentTiktoks(set) {
  fs.writeFileSync(SENT_LOG_FILE, JSON.stringify([...set], null, 2));
}

// Get trending TikToks from the specific search
async function fetchSearchResults() {
  try {
    const response = await axios.get('https://tikwm.com/api/feed/search', {
      params: { keyword: SEARCH_QUERY, count: 20 }
    });
    const results = response.data.data || [];
    return results.map(item => item.share_url);
  } catch (err) {
    console.error('❌ Error fetching TikTok search:', err.message);
    return [];
  }
}

// Pick one new video that hasn't been sent before
async function getUniqueTikTok() {
  const sentSet = loadSentTiktoks();
  const allResults = await fetchSearchResults();

  const unsent = allResults.filter(url => !sentSet.has(url));
  if (unsent.length === 0) {
    console.warn('⚠️ No new TikToks available.');
    return null;
  }

  const random = unsent[Math.floor(Math.random() * unsent.length)];
  sentSet.add(random);
  saveSentTiktoks(sentSet);
  return random;
}

// Send messages to all friends
async function sendTikTokToFriends() {
  const extraTikTok = await getUniqueTikTok();

  for (const id of FRIEND_IDS) {
    try {
      const user = await client.users.fetch(id);

      let message = `🎬 Daily TikTok!\n${MAIN_TIKTOK}`;
      if (extraTikTok) {
        message += `\n🎞️ Bonus Edit:\n${extraTikTok}`;
      }

      await user.send(message);
      console.log(`✅ Sent to ${user.username}`);
    } catch (err) {
      console.error(`❌ Could not send to ${id}:`, err.message);
    }
  }
}

client.login(TOKEN);

// Express keep-alive
const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running on port ${PORT}`);
});


