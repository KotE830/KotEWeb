// const { useMainPlayer } = require("discord-player");
// const { EmbedBuilder } = require("discord.js");

// module.exports = {
//   name: "skipto",
//   description: "skip ahead to track number",
//   cooldown: 1,
//   execute: async (message) => {
//     const player = useMainPlayer();
//     const guildQueue = player.nodes.get(message.guild);

//     if (!guildQueue) {
//       await message.reply("There is no song playing.");
//       return;
//     }

//     const playSong = guildQueue.currentTrack;

//     guildQueue.node.skip();

//     await message.reply({
//       embeds: [
//         new EmbedBuilder()
//           .setDescription(`Skip to **${playSong.title}**`)
//           .setThumbnail(playSong.thumbnail)
//           .setFooter({ text: `Duration: ${playSong.duration}` }),
//       ],
//     });
//   },
// };
