const path = require("path");
const fs = require("node:fs");
const { Client, GatewayIntentBits } = require("discord.js");
const { Player } = require("discord-player");
const { default: DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");

require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 25,
  },
});

client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  ffmpeg: {
    path: "D:/utilities/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe",
  },
  plugins: [new YtDlpPlugin({ update: false })],
});

client.on("error", (e, queue, song) => {
  queue.textChannel.send(`An error encountered: ${e}`);
})

client.login(process.env.TOKEN);

function isBotOn(req, res) {
  res.send(client.isReady() ? "On" : "Off");
}

function botOn(req, res) {
  client.player = new Player(client, {
    ytdlOptions: {
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    },
  });

  client.login(process.env.TOKEN);
  res.send("On");
}

function botOff(req, res) {
  client.player.destroy();
  res.send("Off");
}

module.exports = {
  isBotOn: isBotOn,
  botOn: botOn,
  botOff: botOff,
};
