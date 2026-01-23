import path from "node:path";
import fs from "node:fs";
import { Collection, SlashCommandBuilder } from "discord.js";
import { Command } from "../../commands/types/command";

/**
 * Recursively find all .ts/.js files in commands folder
 * 
 * @param dir - Directory path to search
 * @returns Array of found file paths
 */
function findCommandFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 하위 디렉토리 재귀 탐색 (types 폴더 제외)
      if (item !== "types") {
        files.push(...findCommandFiles(fullPath));
      }
    } else if (
      (item.endsWith(".ts") || item.endsWith(".js")) &&
      !item.endsWith(".d.ts")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Load all commands from commands folder
 * 
 * @returns Collection of Command objects (key: command name, value: Command)
 */
export function getCommands(): Collection<string, Command> {
  const commands = new Collection<string, Command>();
  const commandsPath = path.join(__dirname, "../../commands");

  const commandFiles = findCommandFiles(commandsPath);

  for (const filePath of commandFiles) {
    try {
      // ts-node 환경에서 .ts를 require로 로드
      const commandModule = require(filePath);
      const command: Command | undefined = commandModule.default || commandModule;

      if (!command || !command.data || !command.execute) continue;
      
      const commandName = command.data.name;
      if (commandName) {
        commands.set(commandName, command);
      }
    } catch (error) {
      console.error(`Error loading command from ${filePath}:`, error);
    }
  }

  return commands;
}

/**
 * Extract only command data from all commands in commands folder (for deployment)
 * 
 * @returns Array of Command data (SlashCommandBuilder)
 */
export function getCommandData(): SlashCommandBuilder[] {
  const commands = getCommands();
  const commandData: SlashCommandBuilder[] = [];

  for (const command of commands.values()) {
    if (command.data) {
      commandData.push(command.data);
    }
  }

  return commandData;
}

