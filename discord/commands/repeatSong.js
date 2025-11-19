const { useMainPlayer, QueueRepeatMode } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "repeat",
  aliases: ["rps"],
  description: "Repeat current song or not",
  cooldown: 1,
  execute: async (message) => {
    const player = useMainPlayer();
    let channel;
    try {
      channel = player.nodes.get(message.guild).channel;
    } catch {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("You must be in channel."),
        ],
        ephemeral: true,
      });
    }

    const queue = player.client.distube.getQueue(channel);

    if (queue.repeatMode === 1) {
      await player.client.distube.setRepeatMode(message, 0);
      return message.reply({
        embeds: [
          new EmbedBuilder().setColor("Blue").setDescription(
            `**The song is not repeated`
          ),
        ],
      });
    } else {
      await player.client.distube.setRepeatMode(message, 1);
      return message.reply({
        embeds: [
          new EmbedBuilder().setColor("Blue").setDescription(
            `**The song is repeated`
          ),
        ],
      });
    }
  },
};
