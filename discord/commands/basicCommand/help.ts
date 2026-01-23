import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { Command } from "../types/command";
import { sendError, sendMessage, createEmbed, getCommands } from "../../utils";
import { EmbedColors, UIConfig, DefaultValues } from "../../config";
import path from "node:path";
import fs from "node:fs";

type CommandCategory = string; // 동적 카테고리 타입

interface CommandInfo {
  name: string;
  description: string;
  category: CommandCategory;
}

interface CategoryInfo {
  id: string; // 디렉토리 이름 (예: "basicCommand")
  displayName: string; // 표시 이름 (예: "Basic")
  emoji: string; // 이모지
}

class HelpCommand implements Command {
  readonly title = "Help";
  readonly description = "Show command list or command details";
  readonly data: SlashCommandBuilder;

  constructor() {
    this.data = new SlashCommandBuilder()
      .setName(this.title.toLowerCase())
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName("command")
          .setDescription("Command name to get details (optional)")
          .setRequired(false)
      ) as SlashCommandBuilder;
  }

  /**
   * Generate display name from directory name
   * Example: "basicCommand" -> "Basic", "musicCommand" -> "Music"
   * 
   * @param categoryId - Directory name (category ID)
   * @returns Display name
   */
  private getDisplayName(categoryId: string): string {
    // "Command" 접미사 제거
    const withoutSuffix = categoryId.replace(/Command$/i, "");
    // 첫 글자 대문자, 나머지 소문자
    return withoutSuffix.charAt(0).toUpperCase() + withoutSuffix.slice(1).toLowerCase();
  }

  /**
   * 카테고리별 이모지 매핑
   */
  private getCategoryEmoji(categoryId: string): string {
    const emojiMap: Record<string, string> = {
      basicCommand: "📋",
      musicCommand: "🎵",
      // 나중에 추가될 카테고리들
      adminCommand: "⚙️",
      funCommand: "🎮",
    };
    return emojiMap[categoryId] || "📁";
  }

  /**
   * commands 폴더 내의 모든 카테고리 디렉토리 찾기
   */
  private getAllCategories(): CategoryInfo[] {
    const commandsPath = path.join(__dirname, "../commands");
    const categories: CategoryInfo[] = [];

    if (!fs.existsSync(commandsPath)) {
      return categories;
    }

    const items = fs.readdirSync(commandsPath);
    for (const item of items) {
      const fullPath = path.join(commandsPath, item);
      const stat = fs.statSync(fullPath);

      // 디렉토리이고 types가 아닌 경우
      if (stat.isDirectory() && item !== "types") {
        categories.push({
          id: item,
          displayName: this.getDisplayName(item),
          emoji: this.getCategoryEmoji(item),
        });
      }
    }

    // 알파벳 순으로 정렬
    return categories.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  /**
   * 모든 명령어 정보 수집
   * utils/command.ts의 getCommands()를 사용하여 명령어를 가져옴
   * 각 command의 description 속성에서 직접 가져옴
   * 디렉토리 이름을 동적으로 읽어서 카테고리 구분
   */
  private getAllCommands(): Map<string, CommandInfo> {
    const commands = getCommands();
    const commandInfos = new Map<string, CommandInfo>();
    const commandsPath = path.join(__dirname, "../commands");
    const categories = this.getAllCategories();

    // 각 카테고리 디렉토리를 순회
    for (const category of categories) {
      const categoryPath = path.join(commandsPath, category.id);
      
      if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath);
        for (const file of files) {
          if ((file.endsWith(".ts") || file.endsWith(".js")) && !file.endsWith(".d.ts")) {
            const commandName = path.basename(file, path.extname(file)).toLowerCase();
            const command = commands.get(commandName);
            if (command) {
              // 각 command의 description 속성에서 직접 가져옴
              commandInfos.set(commandName, {
                name: commandName,
                description: command.description || "No description",
                category: category.id, // 디렉토리 이름을 카테고리로 사용
              });
            }
          }
        }
      }
    }

    return commandInfos;
  }

  /**
   * 특정 카테고리의 명령어 목록 생성
   */
  private createCommandList(category: CommandCategory, commandInfos: Map<string, CommandInfo>): string {
    const categoryCommands = Array.from(commandInfos.values()).filter(
      (cmd) => cmd.category === category
    );

    if (categoryCommands.length === 0) {
      return "No commands available.";
    }

    return categoryCommands
      .map((cmd) => `**/${cmd.name}** - ${cmd.description}`)
      .join("\n");
  }

  /**
   * 명령어 목록 Embed 생성
   */
  private createHelpEmbed(category: CommandCategory, commandInfos: Map<string, CommandInfo>): ReturnType<typeof createEmbed> {
    const categories = this.getAllCategories();
    const categoryInfo = categories.find((cat) => cat.id === category);
    
    if (!categoryInfo) {
      // 카테고리를 찾을 수 없는 경우 기본값 사용
      const commandList = this.createCommandList(category, commandInfos);
      return createEmbed(
        "❓ Unknown Category",
        commandList || "No commands available.",
        EmbedColors.HELP
      );
    }

    const categoryName = `${categoryInfo.displayName} Commands`;
    const categoryEmoji = categoryInfo.emoji;
    const commandList = this.createCommandList(category, commandInfos);
    
    let description = commandList || "No commands available.";
    description += "\n\n";
    description += "💡 **Tip:** Use `/help <command>` to get detailed information about a specific command.\n";
    description += "Example: `/help play`";

    return createEmbed(
      `${categoryEmoji} ${categoryName}`,
      description,
      EmbedColors.HELP
    );
  }

  /**
   * 버튼 생성 (동적으로 모든 카테고리에 대해 생성)
   */
  private createButtons(currentCategory: CommandCategory): ActionRowBuilder<ButtonBuilder>[] {
    const categories = this.getAllCategories();
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    
    // Discord 버튼 제한: 한 행에 최대 5개
    const buttonsPerRow = UIConfig.MAX_BUTTONS_PER_ROW;
    
    for (let i = 0; i < categories.length; i += buttonsPerRow) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      const categoryChunk = categories.slice(i, i + buttonsPerRow);
      
      for (const category of categoryChunk) {
        const button = new ButtonBuilder()
          .setCustomId(`help_${category.id}`)
          .setLabel(`${category.emoji} ${category.displayName}`)
          .setStyle(currentCategory === category.id ? ButtonStyle.Primary : ButtonStyle.Secondary);
        
        row.addComponents(button);
      }
      
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * 특정 명령어 상세 정보 Embed 생성
   */
  private createCommandDetailEmbed(commandName: string, commandInfos: Map<string, CommandInfo>): ReturnType<typeof createEmbed> | null {
    const commandInfo = commandInfos.get(commandName.toLowerCase());
    
    if (!commandInfo) {
      return null;
    }

    const categories = this.getAllCategories();
    const categoryInfo = categories.find((cat) => cat.id === commandInfo.category);
    const categoryName = categoryInfo 
      ? `${categoryInfo.displayName} Command`
      : `${this.getDisplayName(commandInfo.category)} Command`;
    const categoryEmoji = categoryInfo?.emoji || DefaultValues.DEFAULT_CATEGORY_EMOJI;

    return createEmbed(
      `${categoryEmoji} /${commandInfo.name}`,
      `**Category:** ${categoryName}\n**Description:** ${commandInfo.description}`,
      EmbedColors.HELP
    );
  }

  async execute(interaction?: ChatInputCommandInteraction): Promise<void> {
    if (!interaction) {
      return;
    }

    const commandName = interaction.options.getString("command");
    const commandInfos = this.getAllCommands();

    // 특정 명령어 상세 정보 요청
    if (commandName) {
      const embed = this.createCommandDetailEmbed(commandName, commandInfos);
      
      if (!embed) {
        await sendError(
          this.title,
          `Command "/${commandName}" not found. Use \`/help\` to see all available commands.`,
          interaction
        );
        return;
      }

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // 명령어 목록 표시 (기본: 첫 번째 카테고리)
    const categories = this.getAllCategories();
    if (categories.length === 0) {
      await sendError(
        this.title,
        "No command categories found.",
        interaction
      );
      return;
    }

    let currentCategory: CommandCategory = categories[0].id;

    const embed = this.createHelpEmbed(currentCategory, commandInfos);
    const buttonRows = this.createButtons(currentCategory);

    const response = await interaction.reply({
      embeds: [embed],
      components: buttonRows,
      fetchReply: true,
    });

    // 버튼 클릭 리스너
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000, // 60초 후 자동 종료
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: "You can only control your own help message!",
          ephemeral: true,
        });
        return;
      }

      // 버튼 ID에서 카테고리 추출 (예: "help_basicCommand" -> "basicCommand")
      const categoryId = buttonInteraction.customId.replace("help_", "");
      if (categories.some((cat) => cat.id === categoryId)) {
        currentCategory = categoryId;
      }

      const updatedEmbed = this.createHelpEmbed(currentCategory, commandInfos);
      const updatedButtonRows = this.createButtons(currentCategory);

      await buttonInteraction.update({
        embeds: [updatedEmbed],
        components: updatedButtonRows,
      });
    });

    collector.on("end", async () => {
      // 버튼 비활성화
      const disabledButtonRows = this.createButtons(currentCategory);
      disabledButtonRows.forEach((row) => {
        row.components.forEach((button) => {
          button.setDisabled(true);
        });
      });

      try {
        await interaction.editReply({
          embeds: [this.createHelpEmbed(currentCategory, commandInfos)],
          components: disabledButtonRows,
        });
      } catch (error) {
        // 메시지가 이미 삭제되었거나 수정할 수 없는 경우 무시
      }
    });
  }
}

export default new HelpCommand();

