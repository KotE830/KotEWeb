const { useMainPlayer } = require("discord-player");
const { EmbedBuilder, ButtonStyle } = require("discord.js");
const { YoutubeExtractor } = require("@discord-player/extractor");
const { QueryType } = require("discord-player");
const { ButtonBuilder, ActionRowBuilder } = require("@discordjs/builders");

require("dotenv").config();

module.exports = {
  name: "play",
  aliases: ["p"],
  description: "Play youtube",
  cooldown: 1,
  execute: async (message, args) => {
    const player = useMainPlayer();
    // console.log(useQueue(Array.from(player.client.voice.adapters.keys())[0]));
    // console.log(player.nodes.queue);
    // console.log(useQueue(message.guild.id));

    // player.extractors.loadDefault();
    player.extractors.register(YoutubeExtractor);

    let channel;

    if (message.webhookId == process.env.WEBHOOK_ID) {
      channel = player.nodes.get(message.guild).channel;
    } else {
      channel = message.member.voice.channel;
    }

    if (!channel) {
      await message.reply(
        "You must be in a voice channel to use this command."
      );
      return;
    }

    const guildQueue = player.nodes.create(message.guild, {
      metadata: channel,
    });

    if (!guildQueue.connection) {
      await guildQueue.connect(channel);
    }

    let url = args[0];
    let result, song;
    let embed = new EmbedBuilder();

    // if (url.startsWith("http")) {
    // console.log("WHY");
    // result = await player.search(url, {
    //   requestedBy: message.user,
    //   searchEngine: QueryType.YOUTUBE_VIDEO,
    // });
    // console.log("NOT");

    // if (result.tracks.length === 0) {
    //   await message.reply("no results found");
    //   return;
    // }

    // song = result.tracks[0];
    // } else if () {
    // result = await player.search(url, {
    //   requestedBy: message.user,
    //   searchEngine: QueryType.YOUTUBE_PLAYLIST,
    // });
    // } else {
    //   result = await player.search(args.join(" "), {
    //     requestedBy: message.user,
    //     searchEngine: QueryType.AUTO,
    //   });

    //   if (result.tracks.length === 0) {
    //     await message.reply("no results found");
    //     return;
    //   }

    //   const len = result.tracks.length < 5 ? result.tracks.length : 5;

    //   let tracks = [];
    //   let row = new ActionRowBuilder();
    //   tracks.push(`Search results for ${args.join(" ")}\n`);
    //   for (let i = 0; i < len; i++) {
    //     tracks.push(
    //       `${i + 1} [${result.tracks[i].duration}] ${result.tracks[i]}`
    //     );
    //     const button = new ButtonBuilder()
    //       .setCustomId(`${i + 1}`)
    //       .setLabel(`${i + 1}`)
    //       .setStyle(ButtonStyle.Primary);

    //     row.addComponents(button);
    //   }
    //   tracks.push("\n0 exit");

    //   embed.setDescription(tracks.join("\n"));

    //   const response = await message.reply({
    //     embeds: [embed],
    //     components: [row],
    //   });

    //   const collectorFilter = (i) => i.user.id === message.author.id;

    //   try {
    //     const confirmation = await response.awaitMessageComponent({
    //       filter: collectorFilter,
    //       time: 10_000,
    //     });
    //     await response.delete();

    //     song = result.tracks[Number(confirmation.customId) - 1];
    //   } catch (e) {
    //     await response.delete();
    //     await message.reply({
    //       content: "Confirmation not received within 10 seconds, cancelling",
    //       components: [],
    //     });
    //     return;
    //   }
    // }
    console.log("fuck");

    try {
      player.client.distube.play(channel, url);
      // player.client.distube.play(channel, url, {
      //   message,
      //   member: message.member,
      // });
      console.log("yes");
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `Added **[${song.title}](${song.url})** to the queue.`
            )
            .setThumbnail(song.thumbnail)
            .setFooter({ text: `Duration: ${song.duration}` }),
        ],
      });
    } catch (error) {
      // await message.reply("There was an error playing the track.");
      await message.reply(`Error playing track: ${error.message}`);
    }
  },
};
