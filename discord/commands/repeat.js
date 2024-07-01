const { useMainPlayer, QueueRepeatMode } = require("discord-player");

const repeatModes = [
  { name: "Off", value: QueueRepeatMode.OFF },
  { name: "Track", value: QueueRepeatMode.TRACK },
  { name: "Queue", value: QueueRepeatMode.QUEUE },
  { name: "Autoplay", value: QueueRepeatMode.AUTOPLAY },
];

module.exports = {
  name: "repeat",
  aliases: ["rp"],
  description: "Repeat queue or not",
  cooldown: 1,
  execute: async (message) => {
    const player = useMainPlayer();
    const guildQueue = player.nodes.get(message.guild);

    if (!guildQueue || !guildQueue.isPlaying()) {
      await message.reply("There is no song playing.");
      return;
    }

    if (guildQueue.repeatMode) {
      guildQueue.setRepeatMode(QueueRepeatMode.OFF);
    } else {
      guildQueue.setRepeatMode(QueueRepeatMode.QUEUE);
    }

    await message.reply(`Current mode: ${guildQueue.repeatMode}`);
  },
};
