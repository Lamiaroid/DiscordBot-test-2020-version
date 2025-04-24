//const { settings } = require("./main.js");
var settings;

var { createCanvas, loadImage } = require("canvas");
const { join } = require("path");
const { Dithering } = require("./dithering.js");
//var Stream = require("stream").Transform;

async function createImageCanvas(src, settingsE) {
    settings = settingsE;
    //  src =
    //     "https://memestatic1.fjcdn.com/comments/Happy+birthday+heres+a+creepy+suggestive+cat+_5f57f2d9aa91e0bdc3b796d16940b2f2.jpg";
    console.log("here");
    var data = await canvasToTextMyFunc(src);
    return new Promise((resolve, reject) => {
        var data = join(__dirname, "image.jpg");
        console.log("meee ", data);
        loadImage(data).then((image) => {
            let width = image.width;
            let height = image.height;
            if (image.width != settings.width * 2) {
                width = settings.width * 2;
                height = (width * image.height) / image.width;
            }

            var canvas = new createCanvas(width - (width % 2), height - (height % 4));

            ctx = canvas.getContext("2d");
            ctx.fillStyle = "#FFFFFF"; //get rid of alpha
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas);
        });
    });
}

function pixelsToCharacter(pixels_lo_hi) {
    //expects an array of 8 bools
    //Codepoint reference - https://www.ssec.wisc.edu/~tomw/java/unicode.html#x2800
    const shift_values = [0, 1, 2, 6, 3, 4, 5, 7]; //correspond to dots in braille chars compared to the given array
    let codepoint_offset = 0;
    for (const i in pixels_lo_hi) {
        codepoint_offset += +pixels_lo_hi[i] << shift_values[i];
    }

    if (codepoint_offset === 0 && settings.monospace === false) {
        //pixels were all blank
        codepoint_offset = 4; //0x2800 is a blank braille char, 0x2804 is a single dot
    }
    return String.fromCharCode(0x2800 + codepoint_offset);
}

function toGreyscale(r, g, b) {
    switch (settings.greyscale_mode) {
        case "luminance":
            return 0.22 * r + 0.72 * g + 0.06 * b;

        case "lightness":
            return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;

        case "average":
            return (r + g + b) / 3;

        case "value":
            return Math.max(r, g, b);

        default:
            console.error("Greyscale mode is not valid");
            return 0;
    }
}

var https = require("https"),
    Stream = require("stream").Transform,
    fs = require("fs");

//var url =
//   "https://cdn.donmai.us/original/34/56/__skadi_arknights_drawn_by_someyaya__3456ea54944225d810422c68ac8fa676.jpg";
//"https://memestatic1.fjcdn.com/comments/Happy+birthday+heres+a+creepy+suggestive+cat+_5f57f2d9aa91e0bdc3b796d16940b2f2.jpg";

var request = require("request").defaults({ encoding: null });

const axios = require("axios");

function canvasToTextMyFunc2() {
    return new Promise((resolve, reject) => {
        axios({
            url,
            responseType: "stream",
        }).then((response) => {
            new Promise((resolve, reject) => {
                response.data
                    .pipe(fs.createWriteStream("image.jpg"))
                    .on("finish", () => resolve())
                    .on("error", (e) => {
                        console.log(e);
                        reject(e);
                    });
                resolve(1);
            });
        });
    });
}

function canvasToTextMyFunc3(canvas) {
    return new Promise((resolve, reject) => {
        request.get(url, function (err, res, body) {
            fs.writeFileSync(join(__dirname, "image.jpg"), body);
            resolve(body);
        });
    });
}

function canvasToTextMyFunc(url) {
    return new Promise((resolve, reject) => {
        var myDataARr = "";
        https.get(url, function (response) {
            // console.log(response);
            var data = new Stream();
            //     response.pipe(fs.createWriteStream(join(__dirname, "image.jpg")));

            response.on("data", function (chunk) {
                data.push(chunk);
                // console.log("chunk ", chunk);
            });

            response.on("end", function () {
                fs.writeFileSync(join(__dirname, "image.jpg"), data.read());
                console.log(data.read());
                resolve(data.read());
            });
        });
    });
}

function canvasToText(canvas) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    let image_data = [];
    if (settings.dithering) {
        if (settings.last_dithering === null || settings.last_dithering.canvas !== canvas) {
            settings.last_dithering = new Dithering(canvas);
        }
        image_data = settings.last_dithering.image_data;
    } else {
        image_data = new Uint8Array(ctx.getImageData(0, 0, width, height).data.buffer);
    }

    let output = "";

    for (let imgy = 0; imgy < height; imgy += 4) {
        for (let imgx = 0; imgx < width; imgx += 2) {
            const braille_info = [0, 0, 0, 0, 0, 0, 0, 0];
            let dot_index = 0;
            for (let x = 0; x < 2; x++) {
                for (let y = 0; y < 4; y++) {
                    const index = (imgx + x + width * (imgy + y)) * 4;
                    const pixel_data = image_data.slice(index, index + 4); //ctx.getImageData(imgx+x,imgy+y,1,1).data
                    if (pixel_data[3] >= 128) {
                        //account for alpha
                        const grey = toGreyscale(pixel_data[0], pixel_data[1], pixel_data[2]);
                        if (settings.inverted) {
                            if (grey >= 128) braille_info[dot_index] = 1;
                        } else {
                            if (grey <= 128) braille_info[dot_index] = 1;
                        }
                    }
                    dot_index++;
                }
            }
            output += pixelsToCharacter(braille_info);
        }
        output += "\n";
    }

    return output;
}

module.exports = {
    createImageCanvas,
    pixelsToCharacter,
    toGreyscale,
    canvasToText,
    canvasToTextMyFunc,
};
