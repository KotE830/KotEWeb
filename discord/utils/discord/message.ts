import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  WebhookClient,
  EmbedData,
} from "discord.js";
import { EmbedColors } from "../../config";

/**
 * Create a Discord embed
 * 
 * @param title - Embed title
 * @param description - Embed description
 * @param color - Embed color (hex number)
 * @param options - Optional additional embed data
 * @returns Created EmbedBuilder instance
 */
export function createEmbed(
  title: string,
  description: string,
  color: number,
  options?: EmbedData
): EmbedBuilder {
  return new EmbedBuilder({
    color: color,
    title: title,
    description: description,
    ...options,
  });
}

/**
 * Common logic for sending embed messages
 * Uses interaction if provided, otherwise uses webhook
 * 
 * @param embed - Embed to send
 * @param interaction - Optional ChatInputCommandInteraction
 */
async function sendEmbedMessage(
  embed: EmbedBuilder,
  interaction?: ChatInputCommandInteraction
): Promise<void> {
  if (interaction) {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  } else if (process.env.WEBHOOK_URL) {
    try {
      const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL });
      await webhookClient.send({ embeds: [embed] });
    } catch (webhookError) {
      console.error("Error sending webhook message:", webhookError);
      throw webhookError;
    }
  } else {
    console.warn("WEBHOOK_URL is not set, skipping Discord message");
  }
}

/**
 * Send an embed message to Discord
 * Uses interaction if provided, otherwise uses webhook
 * 
 * @param title - Message title (required)
 * @param description - Message description (required)
 * @param interaction - Optional ChatInputCommandInteraction (uses interaction if provided, otherwise webhook)
 */
export async function sendMessage(
  title: string,
  description: string,
  interaction?: ChatInputCommandInteraction
): Promise<void>;
/**
 * Send an embed message to Discord with custom color
 * 
 * @param title - Message title (required)
 * @param description - Message description (required)
 * @param color - Embed color (required)
 * @param interaction - Optional ChatInputCommandInteraction (uses interaction if provided, otherwise webhook)
 */
export async function sendMessage(
  title: string,
  description: string,
  color: number,
  interaction?: ChatInputCommandInteraction
): Promise<void>;
// 실제 구현
export async function sendMessage(
  title: string,
  description: string,
  colorOrInteraction?: number | ChatInputCommandInteraction,
  interaction?: ChatInputCommandInteraction
): Promise<void> {
  const isColor = typeof colorOrInteraction === "number";
  const color = isColor ? colorOrInteraction : EmbedColors.SUCCESS;
  const finalInteraction = isColor ? interaction : (colorOrInteraction as ChatInputCommandInteraction | undefined);

  const embed = createEmbed(title, description, color);
  await sendEmbedMessage(embed, finalInteraction);
}

/**
 * Send an error message to Discord
 * Uses interaction if provided, otherwise uses webhook
 * 
 * @param title - Error message title
 * @param description - Error message description
 * @param interaction - Optional ChatInputCommandInteraction (uses interaction if provided, otherwise webhook)
 */
export async function sendError(
  title: string,
  description: string,
  interaction?: ChatInputCommandInteraction
): Promise<void> {
  const embed = createEmbed(
    title,
    description || "There was an error",
    EmbedColors.ERROR
  );
  if (interaction) {
    // interaction이 있으면 interaction 사용 (ephemeral: true)
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } else {
    // interaction이 없으면 webhook 사용
    if (process.env.WEBHOOK_URL) {
      try {
        const webhookClient = new WebhookClient({
          url: process.env.WEBHOOK_URL,
        });
        await webhookClient.send({ embeds: [embed] });
      } catch (webhookError) {
        console.error("Error sending webhook error message:", webhookError);
      }
    }
  }
}

