require('dotenv').config();
require('./keepAlive');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const cron = require('node-cron');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

const TOKEN = process.env.DISCORD_TOKEN;
const TIKTOK_URL = 'https://www.tiktok.com/@du_duruu/video/7362722874018286853';

const FRIEND_IDS = [
  '686652284696002560', // abdallah
  '203048947705446400', // kossay
  '837464580887281696', // ali
  '436559024788340746', // moez
  '543488162219950080', // ania
  '295190404842782721'  // you
];

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const sentDates = new Set();

  cron.schedule('0 9 * * *', () => {
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

async function sendTikTokToFriends() {
  for (const id of FRIEND_IDS) {
    try {
      const user = await client.users.fetch(id);
      await user.send(`🎬 Daily TikTok! ${TIKTOK_URL}`);
      console.log(`✅ Sent to ${user.username}`);
    } catch (err) {
      console.error(`❌ Could not send to ${id}:`, err.message);
    }
  }
}

client.login(TOKEN);



const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is alive!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

