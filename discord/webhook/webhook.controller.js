const { useMainPlayer } = require("discord-player");
const { WebhookClient } = require("discord.js");

require("dotenv").config();

function Play(req) {
  if (process.env.WEBHOOK_URL) {
    const webhookClient = new WebhookClient({
      url: process.env.WEBHOOK_URL,
    });

    webhookClient.send({
      content: process.env.PREFIX + "play " + req.query.song,
    });
  }
}

function Queue(req, res) {
  try {
    const player = useMainPlayer();
    console.log(player.queues.cache.get(
      Array.from(player.client.voice.adapters.keys())[0]
    ).tracks);
    const guildQueue = player.queues.cache.get(
      Array.from(player.client.voice.adapters.keys())[0]
    );
    console.log(
      guildQueue.tracks.toArray.map((song, i) => {
        return `${i + 1} [${song.title}]`;
      })
    );
    res.send(["HHH"]);
  } catch (e) {
    res.send(["There is no queue"]);
  }
  // const guildQueue = player.nodes.get(message.guild);
  // console.log(guildQueue);
  // const guildQueue = player.queues.cache.get(Array.from(player.client.voice.adapters.keys())[0]);
  // console.log(player);
  // const queueArray = guildQueue.tracks.toArray();
}

module.exports = {
  Play: Play,
  Queue: Queue,
};
