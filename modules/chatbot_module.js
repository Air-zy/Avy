let client;
let discordjs;
let firedb;

const fs = require('fs');
const axios = require('axios');

// values

const configData = JSON.parse(fs.readFileSync('json_storage/configs.json'));
const imgnamewatermark = configData[0].img_name_stamp
const main_funcs = require("../functions");
const new_generator = require("./open_ai.js");

// Functions

const newGenerate = new_generator.generate
const toText = main_funcs.toText;

const hasCharacter = (inputString) => {
  // Regular expression to check if the string contains at least one character
  const characterRegex = /./;
  // Test the input string against the regular expression
  return characterRegex.test(inputString);
};

function getAutherName(author) {
  let auther_name = "???";
  if (author.globalName){
    auther_name = author.globalName
  } else {
    auther_name = author.username
  }
  if (auther_name.length < 1){
    auther_name = "???";
  }
  return auther_name;
}

const pingRegex = /<@(\d+)>/g;
function messageContentFilter(msg){
  let msgcontent = msg.content

  //replace ping with name
  if (msg.mentions.users.size > 0) {
    let mentionuser;
    msg.mentions.users.forEach((mentionedMember) => {
      mentionuser = mentionedMember;
    });
    msgcontent = msgcontent.replace(pingRegex, `@${getAutherName(mentionuser)}`);
  }

  if (msg.mentions.repliedUser && client.user.id != msg.mentions.repliedUser.id && client.user.id != msg.author.id) {
    msgcontent = "@" + getAutherName(msg.mentions.repliedUser) + " " + msgcontent
  }

  return msgcontent
}

async function filterresponse(txt, prevmessages) {
  if (typeof txt == 'string') {
    txt = txt.substring(0, 2000);

    //removes avy double occurances
    txt = txt.replace(/avy: /gi, "");
    txt = txt.replace(/{{avy}}: /gi, "");

    //artifacts
    txt = txt.replace(/{{/gi, "");
    
    // avy talks like whoever sais
    prevmessages.forEach((msg) => {
      if (msg.author.id != client.user.id) {
        let author_name = getAutherName(msg.author).toLowerCase();
        if (txt.toLowerCase().includes(author_name + ":")) {
          txt = txt.split(author_name + ":").join("");
        }
      }
    })

    return txt
    
  } else {
    return txt
  }
}

// Main
const AIName = "Avy";

// Avoid embarrassment
const coreprompt = process.env['SystemPrompt'].replace(/CHAR/g, AIName)

const apiurl = 'https://api.wzunjh.top/v1/chat/completions'
const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${process.env.OPENAI}`,
};

async function send_msg(history){
  //const response = await newGenerate(history, 4)
  try {
    let response = await newGenerate(history, "gpt-3.5-turbo")
    if (response.toLowerCase().includes("i cannot") || response.toLowerCase().includes("assist") || response.toLowerCase().includes("response ") || response.toLowerCase().includes("fulfill") || response.toLowerCase().includes("generate") || response.toLowerCase().includes("model") || response.toLowerCase().includes("conversation")) { 
      console.log("[open_ai fail 1]" + response)
      response = await newGenerate(history, "gpt-3.5-turbo-1106")
    }
    if (response.toLowerCase().includes("i cannot") || response.toLowerCase().includes("assist") || response.toLowerCase().includes("response ") || response.toLowerCase().includes("fulfill") || response.toLowerCase().includes("generate") || response.toLowerCase().includes("model") || response.toLowerCase().includes("conversation")) {
      throw response;
    }
    return response
  } catch (err) { 
    console.log("[OEPN AI FAIL]: ", err);
  }
}

const replacements = {
  'fuck': 'f',
  'bitch': 'bish',
  'penis': 'pencil',
  'cock': 'pencil',
  'rape': 'attack',
  // Add more bad word replacements as needed
};
function filterMsg_Content(msgContent) {
  let filteredMsg = msgContent;
  for (const badWord in replacements) {
    if (Object.prototype.hasOwnProperty.call(replacements, badWord)) {
      const regex = new RegExp(badWord, 'gi');
      filteredMsg = filteredMsg.replace(regex, replacements[badWord]);
    }
  }
  return filteredMsg;
}

async function handle_chat(message) {
  try {
    let auther_name = getAutherName(message.author);
    const sysprompt = coreprompt//.replace(/\?\?\?/g, auther_name)
    const mChannel = message.channel;
    const history = [
      {
        role: "system",
        content: sysprompt
      },
    ];
    let prevmessages = await message.channel.messages.fetch({ limit: 17 });
    prevmessages = prevmessages.reverse();
    prevmessages.forEach((msg) => {
      //let msg_content = messageContentFilter(msg).substring(0, 256);
      let msg_content = filterMsg_Content(messageContentFilter(msg).substring(0, 128));
      if (msg.author.id == client.user.id) {
        history.push(
          {
            role: 'assistant',
            content: AIName + ": " + msg_content
          }
        );
      } else {
        history.push(
          {
            role: 'user',
            content: getAutherName(msg.author) + ": " + msg_content
          }
        );
      }
    })

    mChannel.sendTyping();
    let resposeTxt = await send_msg(history);
    if (mChannel.type == 1){
      console.log('(dm) Avy: ' + resposeTxt + '\n');
    } else {
      console.log(`(${mChannel.name}) Avy: ` + resposeTxt + '\n');
    }

    let response = await filterresponse(resposeTxt, prevmessages);
    if (response && hasCharacter(response)){
      if (mChannel.type == 1){ // dm
        mChannel.send(response);
      } else {
        message.reply(response);
      }
    } else {
      //response = "."
      //message.reply(response);
      console.log("[ERR EMPTY RESPONSE] ", response)
    }

  } catch (err) { 
    console.log("[CHAT ERROR] ", err)//, err)
  }
}

function pass_exports(p_client, p_discordjs, p_firedb) {
  client = p_client;
  discordjs = p_discordjs;
  firedb = p_firedb;
  new_generator.pass_exports(p_firedb)
}

module.exports = {
  handle_chat,
  pass_exports,
};
