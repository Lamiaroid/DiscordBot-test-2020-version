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

const { comms_list, getVkUserId } = require("./commands.js");
const fs = require("fs");
let config = require("./config.json");
let token = config.token;
let prefix = config.prefix;

const queue = new Map();
var herePlayer;
var currentSong = 0;
var currentGuild;
var currChannel;
const musicFolder = "/music";
// how to play song across 2 channels?
async function loop(guild, song, connection) {
    const serverQueue = queue.get(guild.id);

    //  const connection = getVoiceConnection(guild.id);

    // this { object } is added because bot crashed without it, seems like watermark was too low
    // but still it's laggy sound

    var audioPlayer = createAudioPlayer();

    connection.subscribe(audioPlayer);

    herePlayer = audioPlayer;

    // const connection2 = getVoiceConnection(guild.id);
    // connection2.subscribe(audioPlayer);

    serverQueue.textChannel.send(`Сейчас играет: **${song.title}**`);

    var resource = getCreatedAudioResource(song);

    //console.log("it is resource ", resource);

    audioPlayer.play(resource);

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
        if (!serverQueue.songs[0]) {
            connection.disconnect();
            queue.delete(guild.id);
        } else {
            var resource = getCreatedAudioResource(serverQueue.songs[0]);
            audioPlayer.play(resource);
        }
    });
}

function playerNextTrack() {
    const serverQueue = queue.get(currentGuild);

    console.log("songs ", serverQueue.songs.length, " ", currentSong);
    if (serverQueue.songs.length > currentSong + 1) {
        currentSong++;
        var resource = getCreatedAudioResource(serverQueue.songs[currentSong]);
        console.log("sng is ", serverQueue.songs[currentSong]);
        herePlayer.play(resource);

        serverQueue.textChannel.send(`Сейчас играет: **${serverQueue.songs[currentSong].title}**`);
    }
}

function playerPreviousTrack() {
    const serverQueue = queue.get(currentGuild);

    console.log("songs ", serverQueue.songs.length, " ", currentSong);
    if (currentSong - 1 >= 0) {
        currentSong--;
        var resource = getCreatedAudioResource(serverQueue.songs[currentSong]);
        console.log("sng is ", serverQueue.songs[currentSong]);
        herePlayer.play(resource);

        serverQueue.textChannel.send(`Сейчас играет: **${serverQueue.songs[currentSong].title}**`);
    }
}

async function execute(message, serverQueue, needLoop, bot) {
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
        return message.channel.send("Пожалуйста, зайди в голосовой канал");
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send("У меня нет разрешений в этом канале");
    }

    var song = null;
    var songInfo;
    try {
        songInfo = await ytdl.getInfo(args[1]);
        song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            type: "youtube",
        };
    } catch (ex) {
        if (fs.existsSync(join(__dirname, musicFolder, args[1]))) {
            song = {
                title: args[1],
                url: "-",
                type: "file",
            };
        } else {
            return message.channel.send(
                "Пока что поддерживаются только youtube треки и ещё кое-какие"
            );
        }
    }

    currentGuild = message.guild.id;

    if (!serverQueue) {
        const queueContract = {
            textChannel: await bot.channels.fetch("941686000827105310"),
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };

        queue.set(message.guild.id, queueContract);
        queueContract.songs.push(song);

        try {
            const connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            queueContract.connection = connection;

            if (!needLoop) {
                play(message.guild, queueContract.songs[0], connection);
            } else {
                loop(message.guild, queueContract.songs[0], connection);
            }
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send("Что-то пошло не так T_T");
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return message.channel.send(`**${song.title}** добавлена в очередь`);
    }
}

function play(guild, song, connection) {
    const serverQueue = queue.get(guild.id);
    /* if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }*/

    //const connection = getVoiceConnection(guild.id);

    // var resource = createAudioResource(ytdl(song.url));

    var audioPlayer = createAudioPlayer();

    connection.subscribe(audioPlayer);

    herePlayer = audioPlayer;

    changeNextTrackTitle();
    // serverQueue.textChannel.send(`Сейчас играет: **${song.title}**`);

    var resource = getCreatedAudioResource(song);

    audioPlayer.play(resource);

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
        // this is for deleetion from list
        //  serverQueue.songs.shift();
        currentSong++;
        if (!serverQueue.songs[currentSong]) {
            // connection.disconnect();
            // queue.delete(guild.id);
            currentSong = 0;
        }
        var resource = getCreatedAudioResource(serverQueue.songs[currentSong]);
        audioPlayer.play(resource);
        changeNextTrackTitle();
        //   serverQueue.textChannel.send(`Сейчас играет: **${serverQueue.songs[currentSong].title}**`);
    });
}

function getCreatedAudioResource(song) {
    var resource;
    switch (song.type) {
        case "youtube":
            resource = createAudioResource(
                ytdl(song.url, {
                    filter: "audioonly",
                    quality: "highestaudio",
                    highWaterMark: 1 << 25,
                })
                // do i need this wtf? { highWaterMark: 1 }
            );
            return resource;

        case "file":
            resource = createAudioResource(join(__dirname, musicFolder, song.title), {
                inlineVolume: true, //true, this takes performance but without it we can't play mixed youtube and filed music
            });
            // can't set volume if inline volume is false

            resource.volume.setVolume(0.5);

            return resource;

        default:
            return null;
    }
}

function stopsong(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send("Нужно быть в голосовом канале, чтобы остановить музыку");
    }

    if (!serverQueue) {
        return message.channel.send("Сейчас ничего не играет");
    }

    herePlayer.stop();
    queue.delete(message.guild.id);
    serverQueue.songs = [];
    //  conn.disconnect();

    //  serverQueue.connection.dispatcher.end();
}

function getCurrentPlayer() {
    return herePlayer;
}

function getQueueGuildId(message) {
    return queue.get(message.guild.id);
}

function playerPause() {
    herePlayer.pause();
}

function playerUnpause() {
    herePlayer.unpause();
}

function getSongName() {
    const serverQueue = queue.get(currentGuild);
    return serverQueue.songs[currentSong].title;
}

function setCurrChannel(chann) {
    currChannel = chann;
}

function changeNextTrackTitle() {
    currChannel.messages
        .fetch({ limit: 1 })
        .then((messages) => {
            const lastMessage = messages.first();
            lastMessage.edit(`Сейчас играет: **${getSongName()}**`);
            console.log(`Сейчас играет: **${getSongName()}**`);
        })
        .catch((err) => {
            console.error(err);
        });
}

module.exports = {
    getCurrentPlayer,
    execute,
    stopsong,
    getQueueGuildId,
    playerPause,
    playerUnpause,
    playerNextTrack,
    playerPreviousTrack,
    getSongName,
    setCurrChannel,
};
