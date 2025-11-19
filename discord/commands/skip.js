const { useMainPlayer } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "skip",
  aliases: ["s"],
  description: "skip this song",
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
    if (!queue) {
      return message.reply({
        embeds: [
          new EmbedBuilder().setColor("Red").setDescription("No active queue."),
        ],
        ephemeral: true,
      });
    }

    await queue.skip(channel);
    const currentSong = queue.songs[0];

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`Skipped **${currentSong.name}**`)
          .setThumbnail(currentSong.thumbnail)
          .setFooter({ text: `Duration: ${currentSong.formattedDuration}` }),
      ],
    });
  },
};
