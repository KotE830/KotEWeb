const path = require("path");
const fs = require("node:fs");
const { Collection, Events } = require("discord.js");

const prefix = process.env.PREFIX;

let commands = new Collection();
const commandsPath = path.join(__dirname, "../commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.set(command.name, command);
  if (command.aliases) {
    for (const alias of command.aliases) {
      commands.set(alias, command);
    }
  }
}

const cooldowns = new Collection();

module.exports = {
  name: Events.MessageCreate,
  execute(msg) {
    if (!msg.content.startsWith(prefix) || msg.author.bot) return;
    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift();
    const command = commands.get(commandName);
    if (!command) {
      return msg.reply(`${msg.content} 해당 명령어는 존재하지 않습니다.`);
    }

    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(msg.author.id)) {
      const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return msg.reply(
          `${command.name} 해당 명령어를 사용하기 위해서는 ${timeLeft.toFixed(
            1
          )}초를 더 기다리셔야 합니다.`
        );
      }
    }
    timestamps.set(msg.author.id, now);
    setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

    try {
      command.execute(msg, args);
    } catch (error) {
      console.log(error);
    }
  },
};
