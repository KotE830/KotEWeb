const { useMainPlayer } = require("discord-player");
const { EmbedBuilder } = require("discord.js");
const { YoutubeExtractor } = require("@discord-player/extractor");

require("dotenv").config();

module.exports = {
  name: "join",
  aliases: ["j"],
  description: "Join the channel",
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

    message.reply({
      embeds: [new EmbedBuilder().setDescription(`Join the channel`)],
    });
  },
};
