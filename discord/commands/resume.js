const { useMainPlayer } = require("discord-player");

module.exports = {
  name: "resume",
  description: "Resumes the current song",
  cooldown: 1,
  execute: async (message) => {
    const player = useMainPlayer();

    player.nodes.get(message.guild).node.resume();

    await message.reply("Resumed playing.");
  },
};
