const { Client, Intents } = require("discord.js");
const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require("discord.js");
const { getVkUserId } = require("./commands.js");

const {
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
} = require("./musicPlayer.js");

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

const { comms_list, getPlayerReal } = require("./commands.js");
let config = require("./config.json");
let token = config.token;
let prefix = config.prefix;

var VkApiError = require("./notMineVkApiError.js");
var VkRequest = require("./notMineVkRequest.js");
var VkToken = require("./notMineVkToken.js");

bot.on("voiceStateUpdate", (oldVoiceState, newVoiceState) => {
    if (newVoiceState.channel) {
        console.log(
            `${newVoiceState.member.user.username} присоединился к каналу ${newVoiceState.channel.name}`
        );
    } else if (oldVoiceState.channel) {
        console.log(
            `${oldVoiceState.member.user.username} отсоединился от канала ${oldVoiceState.channel.name}`
        );
    }
});

//add random changing bot activity + add more activities
bot.on("ready", function () {
    var activities = [
        {
            type: "STREAMING",
            text: "и ест чипсики",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
        {
            type: "STREAMING",
            text: "что-то очень крутое",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
        {
            type: "COMPETING",
            text: "с лучшим другом в гляделки",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
        {
            type: "LISTENING",
            text: "чей-то прекрасный голос",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
        {
            type: "LISTENING",
            text: "злые лисьи звуки",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
        {
            type: "PLAYING",
            text: "в полном одиночестве",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
        {
            type: "PLAYING",
            text: "с закрытыми глазами",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
        {
            type: "WATCHING",
            text: "за работой ядерного реактора",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
        {
            type: "WATCHING",
            text: "аниме со своей подругой",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
        {
            type: "WATCHING",
            text: "на закаты лёжа на холме",
            url: "https://www.twitch.tv/nocopyrightsounds",
        },
    ];

    console.log(bot.user.username + " готов");

    var activityNumber = 8;
    bot.user.setActivity(activities[activityNumber].text, {
        type: activities[activityNumber].type,
        url: activities[activityNumber].url,
    });

    setInterval(() => {
        activityNumber = Math.floor(Math.random() * activities.length);
        bot.user.setActivity(activities[activityNumber].text, {
            type: activities[activityNumber].type,
            url: activities[activityNumber].url,
        });
    }, 5 * 60 * 1000);
});

bot.on("reconnecting", () => {
    console.log("Reconnecting!");
});

bot.on("disconnect", () => {
    console.log("Disconnect!");
});

bot.on("message", async (message) => {
    if (
        message.author.username !== bot.user.username &&
        message.author.discriminator !== bot.user.discriminator
    ) {
        var comm = message.content.trim() + " ";
        var comm_name = comm.slice(0, comm.indexOf(" "));
        var messArr = comm.split(" ");
        console.log(message.author.username + " воспользовался ботом, команда: " + message.content);

        const serverQueue = getQueueGuildId(message);

        // bot-test-player
        setCurrChannel(await bot.channels.fetch("948189197804650638"));

        if (message.content.startsWith(`${prefix}play`)) {
            execute(message, serverQueue, false, bot);
            return;
        } else if (message.content.startsWith(`${prefix}stop`)) {
            stopsong(message, serverQueue);
            return;
        } else if (message.content.startsWith(`${prefix}loop`)) {
            execute(message, serverQueue, true, bot);
            return;
        } else if (message.content.startsWith(`${prefix}vkPost_`)) {
            await generateVkPostForDiscord(message);
            return;
        } else if (message.content.startsWith(`${prefix}me`)) {
            button(message);
            return;
        } else if (message.content.startsWith(`${prefix}you`)) {
            selectOption(message);
            return;
        } else if (message.content.startsWith(`${prefix}like`)) {
            like(message);
            return;
        } else {
            for (comm_count in comms_list) {
                var comm2 = prefix + comms_list[comm_count].name;
                if (comm2 == comm_name) {
                    comms_list[comm_count].out(bot, message, messArr);
                    return;
                }
            }
            if (message.content.startsWith(`${prefix}`)) {
                message.channel.send("Такой команды я не знаю :c");
            }
        }
    }
});

bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    //console.log(interaction);
    if (interaction.customId === "primary6") {
        await interaction.reply("Наконец-то");
    }

    if (interaction.customId === "primary4") {
        await interaction.channel.send("Наконец-то ");
        await interaction.channel.send("<:BloodTrail:941847455455146025>");
    }

    if (interaction.customId === "primary3") {
        const button = new MessageButton()
            .setCustomId("primary")
            .setLabel("Пожалуйста")
            .setStyle("PRIMARY");

        const row = new MessageActionRow().addComponents(button);

        await interaction.update({ content: "Ура!", components: [row] });
    }

    if (interaction.customId === "primary2") {
        await interaction.reply("Наконец-то");
        await interaction.followUp("Что-то произошло");
    }

    if (interaction.customId === "primary") {
        await interaction.reply("Наконец-то");
        await interaction.deleteReply();
    }

    if (interaction.customId === "deleteDrawnImage") {
        await interaction.reply("Наконец-то");
        await interaction.deleteReply();
    }

    if (interaction.customId === "deleteDrawnChoices") {
        await interaction.delete().catch();
    }

    const row = getPlayerReal();
    if (interaction.customId === "playerPreviousTrack") {
        playerPreviousTrack();

        await interaction.update({
            content: `Сейчас играет: **${getSongName()}**`,
            components: [row.row, row.row2],
        });
    }

    if (interaction.customId === "playerPauseTrack") {
        playerPause();

        await interaction.update({ content: "Мы на паузе", components: [row] });
    }

    if (interaction.customId === "playerPlayTrack") {
        playerUnpause();

        await interaction.update({
            content: `Сейчас играет: **${getSongName()}**`,
            components: [row.row, row.row2],
        });
    }

    if (interaction.customId === "playerNextTrack") {
        playerNextTrack();

        await interaction.update({
            content: `Сейчас играет: **${getSongName()}**`,
            components: [row.row, row.row2],
        });
    }
});

function like(message) {
    message.react("<:BloodTrail:941847455455146025>");
    message.channel.send("Нет");
}

function selectOption(message) {
    const row = new MessageActionRow().addComponents(
        new MessageSelectMenu()
            .setCustomId("select")
            .setPlaceholder("Ничего не выбрано")
            .addOptions([
                {
                    label: "Выбери меня",
                    description: "Что-то интересное",
                    value: "first_option",
                },
                {
                    label: "Или меня",
                    description: "Что-то ещё более интересное",
                    value: "second_option",
                },
            ])
    );

    message.channel.send({ content: "Выбери что-то", components: [row] });
}

function button(message) {
    const button = new MessageButton()
        .setCustomId("primary")
        .setLabel("Пожалуйста")
        .setStyle("PRIMARY");
    const button2 = new MessageButton()
        .setCustomId("primary2")
        .setLabel("Ткни")
        .setStyle("SECONDARY");
    const button3 = new MessageButton().setCustomId("primary3").setLabel("Уже").setStyle("SUCCESS");
    const button4 = new MessageButton().setCustomId("primary4").setLabel("Куда").setStyle("DANGER");
    const button5 = new MessageButton()
        .setLabel("Нибудь")
        .setStyle("LINK")
        .setURL("https://www.twitch.tv/nocopyrightsounds");
    //.setEmoji("123456789012345678");
    const button6 = new MessageButton()
        .setCustomId("primary6")
        .setLabel("Ткни")
        .setStyle("SECONDARY");
    const button7 = new MessageButton().setCustomId("primary7").setLabel("Уже").setStyle("SUCCESS");

    const row = new MessageActionRow()
        .addComponents(button)
        .addComponents(button6)
        .addComponents(button7);
    const row2 = new MessageActionRow().addComponents(button2);
    const row3 = new MessageActionRow().addComponents(button3);
    const row4 = new MessageActionRow().addComponents(button4);
    const row5 = new MessageActionRow().addComponents(button5);

    message.channel.send({ content: "Тыкай!", components: [row, row2, row3, row4, row5] });
}

bot.on("presenceUpdate", (oldPresence, newPresence) => {
    var member = newPresence.member;
    // User id of the user you're tracking status.
    //  if (member.id === "<userId>") {
    if (newPresence) {
        // oldpresence is null when bot just started so this causes errors
        var stat = "offline";
        if (oldPresence) {
            stat = oldPresence.status;
        }

        if (stat !== newPresence.status) {
            var text = "";
            var image = "";
            var color = "";
            switch (newPresence.status) {
                case "online":
                    text = member.user.username + " сейчас онлайн";
                    image = "https://c.tenor.com/lVXo9rYZECIAAAAC/anime-happy.gif";
                    color = "#008000";

                    break;

                case "idle":
                    text = member.user.username + " сейчас чилит";
                    image =
                        "https://i.pinimg.com/originals/55/c2/3d/55c23d4405ff7c95c0ef84f7177a5004.gif";
                    color = "#FFFF00";

                    break;

                case "dnd":
                    text = member.user.username + " сейчас занят(a)";
                    image = "https://c.tenor.com/-jncD6Ey3CQAAAAC/studying-anime.gif";
                    color = "#FF0000";

                    break;

                case "invisible":
                    text = member.user.username + " сейчас в инвизе";
                    image =
                        "https://pa1.narvii.com/6798/c4cc99533f2de2ac31dce85b013eeaf8739841e0_hq.gif";
                    color = "#808080";

                    break;

                case "offline":
                    text = member.user.username + " сейчас оффлайн (или в инвизе)";
                    image =
                        "https://pa1.narvii.com/6798/c4cc99533f2de2ac31dce85b013eeaf8739841e0_hq.gif";
                    color = "#808080";

                    break;

                default:
                    return;
            }

            console.log(text);

            const channel = member.guild.channels.resolve("941315903717531668");

            const exampleEmbed = new MessageEmbed().setColor(color).setTitle(text).setImage(image);

            channel.send({ embeds: [exampleEmbed] });
        }
    }
});

//вот это работа с вк
var postDescription;
var postAttachment;
var postAttachments = [];
var reposter = {
    avatar: null,
    id: null,
    name: null,
};
var originalPoster = {
    avatar: null,
    id: null,
    name: null,
};

var player = null;
var postId;
var repostTime = null;
var originalPostTime = null;
/*
var vkToken = new VkToken("1", "4IWellKFAbimO3btq6uq");
vkToken
    .getTokenFromCode("client_credentials")
    .then(function (json) {
        console.log(json);
    })
    .catch(function (error) {
        console.log(error);
    });*/

// можно будет просто вставлять строку не это сейчас главное
var vkRequest = new VkRequest(
    "3d7eb416b128a14p309d3dd2f0c4632deed9807d82dd58792a22fdd8e72e01d4525b17d5hfb2c99aa76a0"
);

//var vkRequest = new VkRequest(vkToken);

function getVkPostInfo(postNumber) {
    postAttachments = [];
    originalPoster.avatar = null;
    originalPoster.id = null;
    originalPoster.name = null;
    reposter.avatar = null;
    reposter.id = null;
    reposter.name = null;
    player = null;
    return new Promise(function (resolve, reject) {
        vkRequest
            .method("wall.get", { owner_id: getVkUserId() /*"-111111111"*/, count: 100, offset: 0 })
            .then(async function (json) {
                //  console.log(json);
                //  console.log(json.response);

                // console.log("это оно ", here);
                // console.log("me ", json.response.items);
                console.log("gigi ", json.response.items[postNumber]);
                //console.log("gigi2 ", gggg);
                //  console.log(json.response.items[0].copy_history);
                //  console.log(json.response.items[0].copy_history[0].text);
                /*    console.log(
                    "its here my dear ",
                    json.response.items[0].copy_history[0].attachments
                );*/
                //  console.log(json.response.items[0].copy_history[0].attachments);

                var res = json.response.items[postNumber];
                repostTime = res.date;
                reposter.id = res.owner_id;

                if (json.response.items[postNumber].copy_history) {
                    res =
                        json.response.items[postNumber].copy_history[
                            json.response.items[postNumber].copy_history.length - 1
                        ];
                    originalPostTime = res.date;
                    originalPoster.id = res.owner_id; // or it should be from_id ???
                    postId = res.id;
                } else {
                    originalPostTime = repostTime;
                    originalPoster.id = reposter.id;
                    reposter.id = null;
                    postId = res.id;
                }
                postDescription = res.text;

                for (var j = 0; j < res.attachments.length; j++) {
                    // just work with photos for now
                    console.log(res);
                    console.log("here the photoX ", res.attachments[0].photo);
                    console.log("here the photoZ ", res.attachments[0].link);

                    if (res.attachments[j].photo) {
                        var maxPhotoWidth = -1;
                        for (var i = 0; i < res.attachments[j].photo.sizes.length; i++) {
                            if (res.attachments[j].photo.sizes[i].width > maxPhotoWidth) {
                                postAttachment = res.attachments[j].photo.sizes[i].url;
                                maxPhotoWidth = res.attachments[j].photo.sizes[i].width;
                            }
                        }
                        console.log("here the photo ", postAttachment);
                        postAttachments.push(postAttachment);
                    }

                    // but it's doc, not gif so it will crush somethimes what will we do?
                    // gif has strange ?extra after gif and that's why discord thinks it's image, not gif, so delete this part
                    if (res.attachments[j].doc) {
                        // var urlDoc = res.attachments[j].doc.url.match(/^.*\.gif/i);
                        //   console.log(urlDoc);
                        var options = {
                            url: res.attachments[j].doc.url,
                            // qs: this1._vkQueryParameters(arguments[1]),
                            simple: false,
                            resolveWithFullResponse: true,
                            forever: true,
                        };

                        //https://vk.com/doc423223227_553956284?hash=16c6a4fe657c084ed0&dl=GIZTANBSGI2DANI:1644759421:9d041c14c6ea858af4&api=1&no_preview=1
                        var urlDoc = await getRealLink(options);
                        //console.log(urlDoc);
                        console.log(res.attachments[j].doc.url);
                        postAttachments.push(urlDoc);
                    }

                    // try to get video not from player but direct variant?? like this https://cs9-1v4.vkuservideo.net/p1/75bf124a7bfb.360.mp4
                    if (res.attachments[j].type === "video") {
                        var previewPhoto = res.attachments[j].video.photo_1280;
                        if (!previewPhoto) {
                            previewPhoto = res.attachments[j].video.photo_800;
                            if (!previewPhoto) {
                                previewPhoto = res.attachments[j].video.photo_320;
                            }
                        }

                        postAttachments.push(previewPhoto); //or  first_frame_1280 photo seems to have better preview pictures?
                        console.log(
                            "vidosek ifo ",
                            res.attachments[j].video.owner_id,
                            res.attachments[j].video.id
                        );
                        player = await getVideoInfo(
                            res.attachments[j].video.owner_id,
                            res.attachments[j].video.id
                        );
                        console.log("видосек ", player);
                    }
                    if (res.attachments[j].type === "link") {
                        var maxPhotoWidth = 0;
                        if (res.attachments[j].link.photo) {
                            for (var i = 0; i < res.attachments[j].link.photo.sizes.length; i++) {
                                if (res.attachments[j].link.photo.sizes[i].width > maxPhotoWidth) {
                                    postAttachment = res.attachments[j].link.photo.sizes[i].url;
                                    maxPhotoWidth = res.attachments[j].link.photo.sizes[i].width;
                                }
                            }
                            postAttachments.push(postAttachment);
                        }
                        postDescription += "\n \n" + res.attachments[j].link.url;
                        console.log("here the photo ", postAttachment);
                    }
                }

                return resolve("fine");
            })
            .catch({ name: "VkApiError" }, function (error) {
                console.log(`VKApi error ${error.error_code} ${error.error_msg}`);
                switch (error.error_code) {
                    case 14:
                        console.log("Captcha error");
                        break;
                    case 5:
                        console.log("No auth");
                        break;
                    default:
                        console.log(error.error_msg);
                }
                return resolve(error.error_code);
            })
            .catch(function (error) {
                console.log(`Other error ${error.error_msg}`);
                return reject(error);
            });
    });
}

function getRealLink(options) {
    return new Promise(function (resolve, reject) {
        request(options)
            .promise()
            .then(function (response) {
                if (response.statusCode !== 200) {
                    return reject(new Error(`${response.statusCode} ${response.body}`));
                }
                //const json = JSON.parse(response.body);
                //    console.log("it;a all ", response);
                var kek = response.toJSON();
                console.log("header ", kek.request.uri.href);
                //     console.log("eto telo ", response.body);
                //  if (json.error) return reject(new VkApiError(json.error));
                return resolve(kek.request.uri.href);
            })
            .catch(function (error) {
                return reject(error);
            });
    });
}

function getVkGroupInfo(groupId) {
    return new Promise(function (resolve, reject) {
        vkRequest
            .method("groups.getById", {
                group_id: Math.abs(groupId),
            })
            .then(function (json) {
                const res = json.response[0];

                return resolve({
                    avatar: res.photo_200,
                    name: res.name,
                });
            })
            .catch({ name: "VkApiError" }, function (error) {
                console.log(`VKApi error ${error.error_code} ${error.error_msg}`);
                switch (error.error_code) {
                    case 14:
                        console.log("Captcha error");
                        break;
                    case 5:
                        console.log("No auth");
                        break;
                    default:
                        console.log(error.error_msg);
                }
                return reject(error);
            })
            .catch(function (error) {
                console.log(`Other error ${error.error_msg}`);
                return reject(error);
            });
    });
}

function getVideoInfo(groupId, videoId) {
    return new Promise(function (resolve, reject) {
        vkRequest
            .method("video.get", {
                videos: `${groupId}_${videoId}`,
                count: 1,
                offset: 0,
            })
            .then(function (json) {
                console.log("here is res ", json.response);
                const res = json.response;
                console.log("here is re2s ", res);

                return resolve(res.items[0].player);
            })
            .catch({ name: "VkApiError" }, function (error) {
                console.log(`VKApi error ${error.error_code} ${error.error_msg}`);
                switch (error.error_code) {
                    case 14:
                        console.log("Captcha error");
                        break;
                    case 5:
                        console.log("No auth");
                        break;
                    default:
                        console.log(error.error_msg);
                }
                return reject(error);
            })
            .catch(function (error) {
                console.log(`Other error ${error.error_msg}`);
                return reject(error);
            });
    });
}

function getVkUserInfo(userId) {
    return new Promise(function (resolve, reject) {
        vkRequest
            .method("users.get", {
                user_ids: Math.abs(userId),
                fields: "photo_200",
            })
            .then(function (json) {
                const res = json.response[0];

                return resolve({
                    avatar: res.photo_200,
                    name: res.first_name + " " + res.last_name,
                    id: res.id,
                });
            })
            .catch({ name: "VkApiError" }, function (error) {
                console.log(`VKApi error ${error.error_code} ${error.error_msg}`);
                switch (error.error_code) {
                    case 14:
                        console.log("Captcha error");
                        break;
                    case 5:
                        console.log("No auth");
                        break;
                    default:
                        console.log(error.error_msg);
                }
                return reject(error);
            })
            .catch(function (error) {
                console.log(`Other error ${error.error_msg}`);
                return reject(error);
            });
    });
}

function randomizeColor() {
    var color = "#";
    var arr = "0123456789abcdef";
    for (var i = 0; i < 6; i++) {
        color += arr[Math.floor(Math.random() * arr.length)];
    }

    return color;
}

async function generateVkPostForDiscord(message) {
    console.log("hi");
    //this is for post with no left line color
    //color = "#2f3136"
    const color = randomizeColor();

    var postCommandArgs = message.content.split("_");

    const channel = await bot.channels.fetch("941768526702706769");

    var info = await getVkPostInfo(postCommandArgs[1]);

    console.log("it's must be here", info);
    if (info !== "fine") {
        switch (info) {
            case 15:
                channel.send("Приватный профиль, не могу взять оттуда пост");
                return;

            default:
                channel.send("Что-то пошло не так :c");
                return;
        }
    }

    var specSignOriginalPoster = "club";
    var originalPosterInfo = null;
    if (originalPoster.id < 0) {
        originalPosterInfo = await getVkGroupInfo(originalPoster.id);
        specSignOriginalPoster = "club";
    } else {
        originalPosterInfo = await getVkUserInfo(originalPoster.id);
        specSignOriginalPoster = "id";
    }

    originalPoster.avatar = originalPosterInfo.avatar;
    originalPoster.name = originalPosterInfo.name;

    var specSignReposter = "club";
    var reposterInfo = null;
    if (reposter.id) {
        if (reposter.id < 0) {
            reposterInfo = await getVkGroupInfo(reposter.id);
            specSignReposter = "club";
        } else {
            reposterInfo = await getVkUserInfo(reposter.id);
            specSignReposter = "id";
        }
        reposter.avatar = reposterInfo.avatar;
        reposter.name = reposterInfo.name;
    }

    var button = null;
    var row = null;
    var exampleEmbed;
    if (!player) {
        if (reposter.id) {
            exampleEmbed = new MessageEmbed()
                .setColor(color)
                .setTitle(`Пост`)
                .setURL(`https://vk.com/wall${originalPoster.id}_${postId}`)
                .setAuthor({
                    name: originalPoster.name,
                    iconURL: originalPoster.avatar,
                    url: `https://vk.com/${specSignOriginalPoster}${Math.abs(originalPoster.id)}`,
                })
                .setDescription(`${timeConverter(originalPostTime)} \n \n ${postDescription}`)
                .setThumbnail(originalPoster.avatar)
                .setImage(postAttachments[0])
                .setFooter({
                    text: `Репостнул(а) ${reposter.name} ${timeConverter(repostTime)}`,
                    iconURL: reposter.avatar,
                });
        } else {
            exampleEmbed = new MessageEmbed()
                .setColor(color)
                .setTitle(`Пост`)
                .setURL(`https://vk.com/wall${originalPoster.id}_${postId}`)
                .setAuthor({
                    name: originalPoster.name,
                    iconURL: originalPoster.avatar,
                    url: `https://vk.com/${specSignOriginalPoster}${Math.abs(originalPoster.id)}`,
                })
                .setDescription(`${timeConverter(originalPostTime)} \n \n ${postDescription}`)
                .setThumbnail(originalPoster.avatar)
                .setImage(postAttachments[0]);
        }
    } else {
        if (reposter.id) {
            exampleEmbed = new MessageEmbed()
                .setColor(color)
                .setTitle(`Пост`)
                .setURL(`https://vk.com/wall${originalPoster.id}_${postId}`)
                .setAuthor({
                    name: originalPoster.name,
                    iconURL: originalPoster.avatar,
                    url: `https://vk.com/${specSignOriginalPoster}${Math.abs(originalPoster.id)}`,
                })
                .setDescription(`${timeConverter(originalPostTime)} \n \n ${postDescription}`)
                .setThumbnail(originalPoster.avatar)
                .setImage(postAttachments[0])
                .setFooter({
                    text: `Репостнул(а) ${reposter.name} ${timeConverter(repostTime)}`,
                    iconURL: reposter.avatar,
                });

            button = new MessageButton()
                .setLabel("Ссылочка на видосик")
                .setStyle("LINK")
                .setURL(player);

            row = new MessageActionRow().addComponents(button);
            // .addField("1", " asd [like so.](https://example.com)", false);
        } else {
            exampleEmbed = new MessageEmbed()
                .setColor(color)
                .setTitle(`Пост`)
                .setURL(`https://vk.com/wall${originalPoster.id}_${postId}`)
                .setAuthor({
                    name: originalPoster.name,
                    iconURL: originalPoster.avatar,
                    url: `https://vk.com/${specSignOriginalPoster}${Math.abs(originalPoster.id)}`,
                })
                .setDescription(`${timeConverter(originalPostTime)} \n \n ${postDescription}`)
                .setThumbnail(originalPoster.avatar)
                .setImage(postAttachments[0]);

            button = new MessageButton()
                .setLabel("Ссылочка на видосик")
                .setStyle("LINK")
                .setURL(player);

            row = new MessageActionRow().addComponents(button);
        }
    }

    if (row) {
        channel.send({ embeds: [exampleEmbed], components: [row] });
    } else {
        channel.send({ embeds: [exampleEmbed] });
    }
    console.log("embed url ", exampleEmbed.image.url);
    console.log("embed width ", exampleEmbed.image.width);
    console.log("embed height ", exampleEmbed.image.height);

    if (postAttachments.length > 1) {
        for (var i = 1; i < postAttachments.length; i++) {
            const embb = new MessageEmbed().setColor(color).setImage(postAttachments[i]);

            channel.send({ embeds: [embb] });
        }
    }
}

function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = [
        "Января",
        "Февраля",
        "Марта",
        "Апреля",
        "Мая",
        "Июня",
        "Июля",
        "Августа",
        "Сентября",
        "Октября",
        "Ноября",
        "Декабря",
    ];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours() < 10 ? "0" + a.getHours() : a.getHours();
    var min = a.getMinutes() < 10 ? "0" + a.getMinutes() : a.getMinutes();
    var time = date + " " + month + " " + year + " в " + hour + ":" + min;

    return time;
}

bot.login(token);
