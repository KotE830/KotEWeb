const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  description: "ping-pong",
  cooldown: 5,
  execute: async (message) => {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FFFFFF")
          .setTitle("답변")
          .setDescription("Pong"),
      ],
    });
  },
};
