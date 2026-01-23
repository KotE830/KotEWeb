import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export interface Command {
  readonly title: string;
  readonly description: string;
  readonly data: SlashCommandBuilder;
  execute(interaction?: ChatInputCommandInteraction): Promise<void>;
}
