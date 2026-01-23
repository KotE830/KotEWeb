import {
  Events,
  Interaction,
  Collection
} from "discord.js";
import { getCommands } from "../utils";
import { Command } from "../commands/types/command";

// commands 폴더에서 모든 Command 로드
const commands: Collection<string, Command> = getCommands();

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command || !command.execute) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);

      const errorMessage = {
        content: "There was an error while executing this command!",
        ephemeral: true,
      } as const;

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },
};


