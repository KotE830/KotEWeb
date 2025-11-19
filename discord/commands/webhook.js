const { EmbedBuilder, WebhookClient } = require("discord.js");

require("dotenv").config();

module.exports = {
  name: "webhook",
  cooldown: 5,
  execute() {
    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("답변")
      .setDescription("Pong");
    const webhookClient = new WebhookClient({
      url: process.env.WEBHOOK_URL,
    });

    webhookClient.send({
      embeds: [embed]
    });
  },
};
