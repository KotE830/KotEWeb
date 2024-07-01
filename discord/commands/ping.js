module.exports = {
  name: "ping",
  cooldown: 5,
  execute(message) {
    const { EmbedBuilder } = require("discord.js");
    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("답변")
      .setDescription("Pong");
    message.reply({ embeds: [embed] });
  },
};
