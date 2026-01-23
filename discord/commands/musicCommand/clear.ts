import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/command";
import { getGuildAndShoukaku, clearQueue, updateQueueMessage, sendMessage } from "../../utils";

class ClearCommand implements Command {
  readonly title = "Clear";
  readonly description = "Clear the music queue";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description);
  }

  async execute(interaction?: ChatInputCommandInteraction): Promise<void> {
    // Bot, Lavalink, Guild 초기화 확인
    const initResult = await getGuildAndShoukaku(this.title, interaction);
    if (!initResult) {
      return;
    }

    const { guild } = initResult;

    // Clear queue
    clearQueue(guild.id);
    
    // Update queue message
    await updateQueueMessage(guild.id);

    await sendMessage(
      this.title,
      "🗑️ Queue has been cleared",
      interaction
    );
  }
}

export default new ClearCommand();

