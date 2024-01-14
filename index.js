const fs = require('fs');
const axios = require('axios');
const discordjs = {Client,GatewayIntentBits,Partials,MessageEmbed} = require("discord.js");

const runserver = require("./webserver.js");
const main_funcs = require("./functions.js");
const cmd_funcs = require("./msg_cmds.js");

const chatbot_mod = require("./modules/chatbot_module.js");

// Values

const Discord_Token = process.env.D_BOT_TOKEN
const cmdprefix = JSON.parse(fs.readFileSync('json_storage/configs.json'))[0].prefix;
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // TEMP FIX FOR CERTIFICATE ERROR [ DO REMOVE WHEN RESOLVED ]

// Functions

async function getRandomRomanceAnime() {
  const romance_animes = [];
  for (let i = 1; i <= 4; i++) {
    try {
      const response = await axios.get('https://api.jikan.moe/v4/top/anime', {
        params: {
          filter: 'bypopularity',
          rating: 'pg13',
          sfw: true,
          limit: 25,
          page: i
        },
      });

      const animeList = response.data.data;
      for (const anime of animeList) {
        const hasDesiredGenre = anime.genres.some(genre => genre.name === "Romance");
        if (hasDesiredGenre && anime.score > 7.9) {
          romance_animes.push(anime);
        }
      }
    } catch (err) {

    }
  }

  if (romance_animes.length > 0) {
    const chosen_anime = romance_animes[Math.floor(Math.random() * romance_animes.length)]
    let title = chosen_anime.title;
    if (chosen_anime.title_english && chosen_anime.title_english.length > 0){
      title = chosen_anime.title_english
    }
    return title;
  } else {
    return "nothing";
  }
}

async function isTalkingToBot(msg) {
  const msgtxt = msg.content.toLowerCase();
  if (
    msg.channel.type === 1 ||
    msgtxt.includes(client.user.id) ||
    msgtxt.includes("everyone") ||
    msgtxt.includes("i hate") ||
    msgtxt.includes("i love") ||
    msgtxt.includes("damn") ||
    msgtxt.includes(" avy") ||
    msgtxt.includes("avy ") ||
    msgtxt.includes("avy,") ||
    msgtxt.includes("avy.") ||
    msgtxt.includes("avy!") ||
    msgtxt == "avy" ||
    msg.mentions.repliedUser == client.user
  ) {
    return true;
  } else {
    return false;
  }
}

// Handle Bot

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  'partials': [Partials.Channel]
});

client.login(Discord_Token).catch(err => {
  console.log(`[DISCORD BOT ERROR] error loging in `, err);
  //process.exit();
});
runserver()

client.on("ready", async () => {
  console.log(`[DISCORD BOT] connected ${client.user.tag}`);
  chatbot_mod.pass_exports(client, discordjs);
  main_funcs.pass_exports(client, discordjs);
  cmd_funcs.pass_exports(client, discordjs);

  const registeredCmds = await client.application.commands.fetch();
  const commands = JSON.parse(fs.readFileSync('json_storage/discord_commands.json'));

  for (const cmd of commands) {
    const exists = registeredCmds.some(registeredCmd => registeredCmd.name === cmd.name);
    if (!exists) {
      console.log(`[DISCORD BOT] {registered ${cmd.name}} command`);
      await client.application.commands.create(cmd);
    }
  }

  for (const registeredCmd of registeredCmds.values()) {
    const exists = commands.some(cmd => cmd.name === registeredCmd.name);
    if (!exists) {
      console.log(`[DISCORD BOT] {removed ${registeredCmd.name}} command`);
      await registeredCmd.delete();
    }
  }

  const random_anime = await getRandomRomanceAnime();
  client.user.setPresence({ 
    activities: [{ 
      name: random_anime, // The name of the activity
      type: 3,  // The type of the activity (1=PLAYING, 2=LISTENING, 3=WATCHING)
    }],
    status: 'online'
  });
});

const userTimeouts = new Map();
const delay = 1000;
client.on('messageCreate', async (message) => {
  if(message.author.id == client.user.id) return;
  if (userTimeouts.has(message.author.id)) {
    return;
  }
  userTimeouts.set(message.author.id, true);

  if (message.channel.type === 1){
    console.log(`(dm) ${message.author.username}: ${message.content}`);
  }

  const msg_channel = message.channel
  if (message.content.startsWith(cmdprefix)) {
    try {
      await cmd_funcs.handle_cmds(message);
    } catch (err) {
      console.log(err);
      if (err.rawError) {
        msg_channel.send("```js\n" + `${err.rawError.message}` + "```");
      } else {
        msg_channel.send("```js\n" + `${err.message}` + "```")
      }
    }
  } else { // dm
    const chk = await isTalkingToBot(message);
    if (chk == true) {
      if (message.channel.type != 1){
        console.log(`${message.author.username}: ${message.content}`);
      }
      await chatbot_mod.handle_chat(message);
    }
  }

  setTimeout(() => {
    userTimeouts.delete(message.author.id);
  }, delay);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  main_funcs.handle_interactions(interaction);  
});
