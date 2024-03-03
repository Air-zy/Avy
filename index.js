const fs = require('fs');

// mobile presence
const filePath = './node_modules/@discordjs/ws/dist/index.js';
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('[Mobile Presence] Error reading file:', err);
        return;
    }
    const match = data.match(/identifyProperties:\s*{([^}]*)}/);
    const modifiedData = data.replace(
      "browser: DefaultDeviceProperty,",
      'browser: "Discord iOS",'
    );
    fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
        if (err) {
            console.error('[Mobile Presence] Error writing file:', err);
            return;
        }
        console.log('[Mobile Presence] File modified successfully.');
    });
});

const axios = require('axios');
const discordjs = require("discord.js");
const { Client, GatewayIntentBits, Partials, MessageEmbed } = discordjs;


const runserver = require("./webserver.js");
const heartpump = require("./heart.js");
const main_funcs = require("./functions.js");
const cmd_funcs = require("./msg_cmds.js");

const chatbot_mod = require("./modules/chatbot_module.js");

// Valuess

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
        const hasRomance = anime.genres.some(genre => genre.name == "Romance");
        if ((hasRomance && anime.score > 7) || (anime.year > 2021 && anime.score > 7)) {
          //console.log(anime.title)
          romance_animes.push(anime);
        }
      }
      
      //
      
      const response2 = await axios.get('https://api.jikan.moe/v4/top/anime', {
        params: {
          filter: 'bypopularity',
          rating: 'r17',
          sfw: true,
          limit: 25,
          page: i
        },
      });

      const animeList2 = response2.data.data;
      for (const anime of animeList2) {
        const hasRomance = anime.genres.some(genre => genre.name == "Romance");
        if ((hasRomance && anime.score > 7) || (anime.year > 2020 && anime.score > 7)) {
          romance_animes.push(anime);
        }
      }
    } catch (err) {
      console.log("[JIKAN ANIME ERR] " + err)
    }
  }

  if (romance_animes.length > 0) {
    const chosen_anime = romance_animes[Math.floor(Math.random() * romance_animes.length)]
    let title = chosen_anime.title;
    console.log(chosen_anime.title)
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
heartpump()

client.on("ready", async () => {
  console.log(`[DISCORD BOT] connected ${client.user.tag}`);

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
    console.log(`(DM) ${message.author.username}: ${message.content}`);
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

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.firebaseJsonKey)
const firebaseApp = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore().collection('tokenUsage');
chatbot_mod.pass_exports(client, discordjs, db);
main_funcs.pass_exports(client, discordjs, db);
cmd_funcs.pass_exports(client, discordjs, db);

if (firebaseApp) {
  console.log("[FIRE BASE] ready");
} else {
  console.log("[FIRE BASE ERR] failed");
}
