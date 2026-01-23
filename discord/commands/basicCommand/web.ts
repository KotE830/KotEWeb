import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../types/command";
import { sendMessage } from "../../utils";
import dotenv from "dotenv";

dotenv.config();

class WebCommand implements Command {
  readonly title = "Web";
  readonly description = "Send the web url to the discord chat channel";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description);
  }

  // Send to discord chat channel
  async sendWebUrl(
    interaction?: ChatInputCommandInteraction
  ): Promise<void> {
    const webUrl: string = process.env.WEB_URL ?? "";
    if (interaction) {
      await sendMessage(this.title, webUrl, interaction);
    } else {
      await sendMessage(this.title, webUrl);
    }
  }

  async execute(
    interaction?: ChatInputCommandInteraction
  ): Promise<void> {
    await this.sendWebUrl(interaction);
  }
}

export default new WebCommand();
