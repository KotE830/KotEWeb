import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/command";
import { getGuildAndShoukaku, toggleRepeating, sendMessage } from "../../utils";

class RepeatCommand implements Command {
  readonly title = "Repeat";
  readonly description = "Toggle repeat mode for the queue";
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

    // 반복 모드 토글
    const newState = toggleRepeating(guild.id);
    const status = newState ? "enabled" : "disabled";
    const emoji = newState ? "🔁" : "⏸️";

    await sendMessage(
      this.title,
      `${emoji} Repeat mode is now **${status}**`,
      interaction
    );
  }
}

export default new RepeatCommand();
