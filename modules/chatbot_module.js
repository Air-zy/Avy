let client;
let discordjs;

const fs = require('fs');
const axios = require('axios');

// values

const configData = JSON.parse(fs.readFileSync('json_storage/configs.json'));
const imgnamewatermark = configData[0].img_name_stamp
const main_funcs = require("../functions");
const new_generator = require("./hugface_redirect.js");

// Functions

newGenerate = new_generator.generate
toText = main_funcs.toText;

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

  if (msg.mentions.repliedUser) {
    msgcontent = "hey @" + getAutherName(msg.mentions.repliedUser) + " " + msgcontent
  }

  return msgcontent
}

async function filterresponse(txt) {
  txt = txt.substring(0, 2000);

  //removes avy double occurances
  txt = txt.replace(/avy: /gi, "");
  
  return txt
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
  const response = await newGenerate(history, 4)
  return response
}

async function handle_chat(message) {
  try {
    let auther_name = getAutherName(message.author);
    const sysprompt = coreprompt.replace(/\?\?\?/g, auther_name)
    const mChannel = message.channel;
    const history = [
      {
        role: "system",
        content: sysprompt
      },
    ];
    let prevmessages = await message.channel.messages.fetch({ limit: 21 });
    prevmessages = prevmessages.reverse();
    prevmessages.forEach((msg) => {
      //let msg_content = messageContentFilter(msg).substring(0, 256);
      let msg_content = messageContentFilter(msg).substring(0, 128);
      if (msg.author.id == client.user.id) {
        history.push(
          {
            role: 'assistant',
            content: msg_content
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

    let response = await filterresponse(resposeTxt);
    if (response && hasCharacter(response)){
      mChannel.send(response);
    } else {
      response = "."
      message.reply(response);
      console.log("[ERR EMPTY RESPONSE] ", response, drawing)
    }

  } catch (err) { 
    console.log("[CHAT ERROR] ", err)//, err)
  }
}

function pass_exports(p_client, p_discordjs) {
  client = p_client;
  discordjs = p_discordjs;
}

module.exports = {
  handle_chat,
  pass_exports,
};
