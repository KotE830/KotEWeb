const { useMainPlayer } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "queue",
  aliases: ["q"],
  description: "Shows the first 10 songs in the queue",
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

    const currentSong = queue.songs[0];
    const songs = queue.songs.slice(1);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setDescription(
            `**Currently Playing:**\n ${currentSong.name}\n\n**Queue:**\n
          ${songs.map(
            (song, id) =>
              `\n**${id + 1}.** ${song.name} - \`${song.formattedDuration}\``
          )}`
          )
          .setThumbnail(currentSong.thumbnail)
          .setFooter({ text: `Duration: ${currentSong.formattedDuration}` }),
      ],
    });
  },
};
