const { useMainPlayer } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "queue",
  aliases: ["q"],
  description: "Shows the first 10 songs in the queue",
  cooldown: 1,
  execute: async (message) => {
    const player = useMainPlayer();
    const guildQueue = player.nodes.get(message.guild);

    if (!guildQueue || !guildQueue.isPlaying()) {
      await message.reply("There is no song playing.");
      return;
    }

    const queueString = guildQueue.tracks
      .toArray()
      .slice(0, 10)
      .map((song, i) => {
        return `${i + 1})  [${song.duration}]\` ${song.title}`;
      })
      .join("\n");

    const currentSong = guildQueue.currentTrack;

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `**Currently Playing:**\n\` ${currentSong.title}\n\n**Queue:**\n${queueString}`
          )
          .setThumbnail(currentSong.thumbnail)
          .setFooter({ text: `Duration: ${song.duration}` }),
      ],
    });
  },
};
