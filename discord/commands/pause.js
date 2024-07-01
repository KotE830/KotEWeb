const { useMainPlayer } = require("discord-player");

module.exports = {
  name: "pause",
  aliases: ["pz", "ps"],
  description: "Pauses the current song",
  cooldown: 1,
  execute: async (message) => {
    const player = useMainPlayer();

    player.nodes.get(message.guild).node.pause();

    await message.reply("The current has been paused.");
  },
};