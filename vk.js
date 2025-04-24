const Discord = require("discord.js"); // Подключаем библиотеку discord.js
//const bot2 = new Discord.Client(); // Объявляем, что robot - бот

const { Client, Intents } = require("discord.js");
const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require("discord.js");
const ytdl = require("ytdl-core");
const {
    joinVoiceChannel,
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
    getVoiceConnections,
} = require("@discordjs/voice");

var request = require("request-promise");
var url = require("url");

var Promise = require("bluebird");

const { createReadStream } = require("fs");
const { join } = require("path");
const { StreamType } = require("@discordjs/voice");

const ffprobe = require("ffprobe");
const ffprobeStatic = require("ffprobe-static");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg");

ffmpeg.setFfprobePath(ffprobeStatic.path);
ffmpeg.setFfmpegPath(ffmpegPath.path);

const { getCurrentPlayer, execute, loop, stopsong } = require("./musicPlayer.js");

const allIntents = new Intents(32767);
//const bot = new Client({ allIntents });
const bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});

// добавить манеру общения бота (можно будет сменить командой)

const { comms_list, getVkUserId } = require("./commands.js");
const fs = require("fs");
let config = require("./config.json");
let token = config.token;
let prefix = config.prefix;

var VkApiError = require("./notMineVkApiError.js");
var VkRequest = require("./notMineVkRequest.js");
var VkToken = require("./notMineVkToken.js");

//Reqeust to VK api for get access token by user code
/*var vkToken = new VkToken("1", "4IWeztWMEbimO3bid8uq");
vkToken
    .getTokenFromCode("client_credentials")
    .then(function (json) {
        console.log(json);
    })
    .catch(function (error) {
        console.log(error);
    });
console.log(vkToken);*/

//https://oauth.vk.com/authorize?client_id=1&display=page&scope=friends,groups,photos&response_type=token&v=5.131&state=123456
