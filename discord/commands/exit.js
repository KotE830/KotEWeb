const { useMainPlayer } = require("discord-player");

module.exports = {
  name: "exit",
  description: "Exits the Voice channel",
  cooldown: 1,
  execute: async (message) => {
    const player = useMainPlayer();
    const queue = player.nodes;

    if (!queue) {
      await message.reply("There is no song playing.");
      return;
    }

    player.destroy();

    message.reply("Stop and clear the player");
  },
};
