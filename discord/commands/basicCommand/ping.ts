import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  WebhookClient
} from "discord.js";
import { Command } from "../types/command";
import { createEmbed } from "../../utils";
import { EmbedColors } from "../../config";

/**
 * Ping command - replies with pong
 */
class PingCommand implements Command {
  readonly title = "Ping";
  readonly description = "Replies with pong";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description);
  }

  /**
   * Execute ping command
   * Sends pong message via interaction or webhook
   * 
   * @param interaction - Optional ChatInputCommandInteraction
   */
  async execute(interaction?: ChatInputCommandInteraction): Promise<void> {
    const embed: EmbedBuilder = createEmbed(this.title, "Pong", EmbedColors.HELP);

    if (interaction) {  // interaction.reply
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    } else {  // webhook
      if (process.env.WEBHOOK_URL) {
        try {
          const webhookClient = new WebhookClient({
            url: process.env.WEBHOOK_URL,
          });
          
          await webhookClient.send({
            embeds: [embed],
          });
        } catch (webhookError) {
          console.error("Error sending webhook message:", webhookError);
          throw webhookError;
        }
      } else {
        throw new Error("WEBHOOK_URL is not set and no interaction provided");
      }
    }
  }
}

export default new PingCommand();
