const discordjs = ({
  Client,
  GatewayIntentBits,
  Partials,
  MessageEmbed,
} = require("discord.js"));

const runserver = require("./webserver.js");

const Discord_Token = process.env.DBOTKEY;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.login(Discord_Token).catch((err) => {
  console.log(`[DISCORD BOT ERROR] error loging in `, err);
  //process.exit();
});
runserver();

client.on("ready", async () => {
  console.log(`[DISCORD BOT] connected ${client.user.tag}`);
});

const userTimeouts = new Map();
const delay = 1000;
client.on("messageCreate", async (message) => {
  if (message.author.id == client.user.id) return;
  if (userTimeouts.has(message.author.id)) {
    return;
  }
  userTimeouts.set(message.author.id, true);

  if (message.content == "ping") {
    message.reply("pong");
  }

  setTimeout(() => {
    userTimeouts.delete(message.author.id);
  }, delay);
});
