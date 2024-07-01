const { useMainPlayer } = require("discord-player");
const { EmbedBuilder, ButtonStyle } = require("discord.js");
const { YoutubeExtractor } = require("@discord-player/extractor");
const { QueryType } = require("discord-player");
const { ButtonBuilder, ActionRowBuilder } = require("@discordjs/builders");

module.exports = {
  name: "play",
  aliases: ["p"],
  description: "Play youtube",
  cooldown: 1,
  execute: async (message, args) => {
    const player = useMainPlayer();
    const channel = message.member.voice.channel;
    
    player.extractors.register(YoutubeExtractor);

    if (!channel) {
      await message.reply(
        "You must be in a voice channel to use this command."
      );
      return;
    }

    const guildQueue = await player.nodes.create(message.guild, {
      metadata: channel,
    });

    if (!guildQueue.connection) {
      await guildQueue.connect(message.member.voice.channel);
    }

    let url = args[0],
      result,
      song;
    let embed = new EmbedBuilder();

    if (url.startsWith("http")) {
      result = await player.search(url, {
        requestedBy: message.user,
        searchEngine: QueryType.YOUTUBE_VIDEO,
      });

      song = result.tracks[0];
      // } else if () {
      // result = await player.search(url, {
      //   requestedBy: message.user,
      //   searchEngine: QueryType.YOUTUBE_PLAYLIST,
      // });
    } else {
      result = await player.search(args.join(" "), {
        requestedBy: message.user,
        searchEngine: QueryType.AUTO,
      });

      const len = result.tracks.length < 5 ? result.tracks.length : 5;

      let tracks = [];
      let row = new ActionRowBuilder();
      tracks.push(`Search results for ${args.join(" ")}\n`);
      for (let i = 0; i < len; i++) {
        tracks.push(
          `${i + 1} [${result.tracks[i].duration}] ${result.tracks[i]}`
        );
        const button = new ButtonBuilder()
          .setCustomId(`${i + 1}`)
          .setLabel(`${i + 1}`)
          .setStyle(ButtonStyle.Primary);

        row.addComponents(button);
      }
      tracks.push("\n0 exit");

      embed.setDescription(tracks.join("\n"));

      const response = await message.reply({
        embeds: [embed],
        components: [row],
      });

      const collectorFilter = (i) => i.user.id === message.author.id;

      try {
        const confirmation = await response.awaitMessageComponent({
          filter: collectorFilter,
          time: 10_000,
        });
        await response.delete();

        song = result.tracks[Number(confirmation.customId) - 1];
      } catch (e) {
        await response.delete();
        await message.reply({
          content: "Confirmation not received within 10 seconds, cancelling",
          components: [],
        });
        return;
      }
    }

    if (result.tracks.length === 0) {
      await message.reply("no results found");
      return;
    }

    if (guildQueue.isPlaying()) {
      guildQueue.addTrack(song);
    } else {
      song.play(channel);
    }

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
  },
};
