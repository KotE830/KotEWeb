const { useMainPlayer } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "skip",
  aliases: ["s"],
  description: "skip this song",
  cooldown: 1,
  execute: async (message) => {
    const player = useMainPlayer();
    const guildQueue = player.nodes.get(message.guild);

    if (!guildQueue) {
      await message.reply("There is no song playing.");
      return;
    }

    const currentSong = guildQueue.currentTrack;

    guildQueue.node.skip();

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`Skipped **${currentSong.title}**`)
          .setThumbnail(currentSong.thumbnail)
          .setFooter({ text: `Duration: ${currentSong.duration}` }),
      ],
    });
  },
};
