const settings = {
    last_canvas: null,
    last_dithering: null,
    last_source: "",

    width: 102,
    greyscale_mode: "luminance",
    inverted: true,
    // must be true after
    dithering: true,
    monospace: false,
};

const { createImageCanvas, canvasToText } = require("./braille.js");

async function loadNewImage(
    src,
    width = 102,
    dithering = true,
    inverted = true,
    monospace = false
) {
    settings.width = width;
    settings.dithering = dithering;
    settings.inverted = inverted;
    settings.monospace = monospace;
    if (src === undefined) return;

    const canvas = await createImageCanvas(src, settings);
    return parseCanvas(canvas);
}

function parseCanvas(canvas) {
    const text = canvasToText(canvas);
    return text;
}

module.exports = { loadNewImage, parseCanvas, settings };
