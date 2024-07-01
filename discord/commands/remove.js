const { useMainPlayer } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "remove",
  aliases: ["r"],
  description: "remove a song from queue",
  cooldown: 1,
  execute: async (message, args) => {
    const player = useMainPlayer();
    const guildQueue = player.nodes.get(message.guild);

    if (!guildQueue || !guildQueue.isPlaying()) {
      await message.reply("There is no song playing.");
      return;
    }

    let embed = new EmbedBuilder();

    if (isNaN(args)) {
      embed.setDescription("Please enter a number");
    } else if (Number(args) >= guildQueue.length) {
      embed.setDescription("Out of range of queue");
    } else {
      const removeSong = guildQueue.tracks.data[Number(args) - 1];
      guildQueue.removeTrack(removeSong);

      embed
        .setDescription(`Skipped **${removeSong.title}**`)
        .setThumbnail(removeSong.thumbnail)
        .setFooter({ text: `Duration: ${song.duration}` });
    }

    await message.reply({
      embeds: [embed],
    });
  },
};
