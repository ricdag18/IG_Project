function composite(bgImg, fgImg, fgOpac, fgPos) {
    const bgData = bgImg.data;
    const fgData = fgImg.data;
    const bgWidth = bgImg.width;
    const bgHeight = bgImg.height;
    const fgWidth = fgImg.width;
    const fgHeight = fgImg.height;

    // loop through each pixel of the foreground image
    for (let y = 0; y < fgHeight; ++y) {
        for (let x = 0; x < fgWidth; ++x) {
            const fgIndex = 4 * (y * fgWidth + x);
            const bgX = x + fgPos.x;
            const bgY = y + fgPos.y;

            // skip if fg pixel is outside bg bounds
            if (bgX < 0 || bgX >= bgWidth || bgY < 0 || bgY >= bgHeight)
                continue;

            const bgIndex = 4 * (bgY * bgWidth + bgX);

            // compute alpha values for blending
            const fgAlpha = fgData[fgIndex + 3] * fgOpac / 255;
            const bgAlpha = 1 - fgAlpha;

            // blend r, g, b channels
            for (let c = 0; c < 3; ++c) {
                bgData[bgIndex + c] = 
                    fgData[fgIndex + c] * fgAlpha + 
                    bgData[bgIndex + c] * bgAlpha;
            }

            // set final alpha to 255
            bgData[bgIndex + 3] = 255;
        }
    }
}
