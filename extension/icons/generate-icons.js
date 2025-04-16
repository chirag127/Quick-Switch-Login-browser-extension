const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function generateIcons() {
    const sizes = [16, 32, 48, 128];
    const svgPath = path.join(__dirname, "icon.svg");

    try {
        // Read the SVG file
        const svgBuffer = fs.readFileSync(svgPath);

        // Generate PNG files for each size
        for (const size of sizes) {
            const pngPath = path.join(__dirname, `icon${size}.png`);

            // Use sharp to resize the SVG and convert to PNG
            await sharp(svgBuffer).resize(size, size).toFile(pngPath);

            console.log(`Generated icon${size}.png`);
        }
    } catch (error) {
        console.error("Error generating icons:", error);
    }
}

generateIcons();
