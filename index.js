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
const SEARCH_QUERIES = [
  'unexpected edits zack d film',
  'unexpected edits',
  'zack d edits',
  'movie transitions',
  'tiktok transitions',
  'epic edits',
  'film meme',
];

const SENT_LOG_FILE = './sent_tiktoks.json';

const FRIEND_IDS = [

  '295190404842782721',// you

];

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const sentDates = new Set();

  cron.schedule('48 9 * * *', () => {
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

function getRandomQuery() {
  return SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
}


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
  const selectedQuery = getRandomQuery();
  console.log('🔍 Using search query:', selectedQuery);

  try {
    const response = await axios.get('https://tikwm.com/api/feed/search', {
      params: { keywords: selectedQuery, count: 20 }
    });

    const results = response.data?.data?.videos;
    if (!Array.isArray(results)) {
      console.error('❌ TikTok API error or bad format:', response.data);
      return [];
    }

    const urls = results
      .map(item => item.url)
      .filter(url => typeof url === 'string' && url.includes('tiktok.com'));

    console.log('🌐 All fetched TikToks:', urls);
    return urls;
  } catch (err) {
    console.error('❌ Error fetching TikTok search:', err.message);
    return [];
  }
}



// Pick one new video that hasn't been sent before
async function getUniqueTikTok() {
  const sentSet = loadSentTiktoks();
  const allResults = await fetchSearchResults();

  console.log('🧾 Already sent:', [...sentSet]);

  const unsent = allResults.filter(url => !sentSet.has(url));

  if (unsent.length === 0 && allResults.length > 0) {
    console.warn('⚠️ All results already sent. Reusing first TikTok:', allResults[0]);
    return allResults[0];
  }

  if (unsent.length === 0) {
    console.warn('⚠️ No TikToks found at all.');
    return null;
  }

  const random = unsent[Math.floor(Math.random() * unsent.length)];
  sentSet.add(random);
  saveSentTiktoks(sentSet);

  console.log(`🎞️ Bonus TikTok selected: ${random}`);
  return random;
}


// Send messages to all friends
async function sendTikTokToFriends() {
  const extraTikTok = await getUniqueTikTok();

  if (!extraTikTok) {
    console.warn('⚠️ No bonus TikTok was available today.');
  } else {
    console.log(`🎞️ Bonus TikTok selected: ${extraTikTok}`);
  }

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


