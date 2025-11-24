const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const icons = ['pwa-192x192', 'pwa-512x512'];

icons.forEach(name => {
    const pngPath = path.join(publicDir, `${name}.png`);
    const jpgPath = path.join(publicDir, `${name}.jpg`);

    if (fs.existsSync(jpgPath)) {
        console.log(`Deleting existing ${name}.jpg`);
        try {
            fs.unlinkSync(jpgPath);
        } catch (e) {
            console.error(`Failed to delete ${name}.jpg:`, e);
        }
    }

    if (fs.existsSync(pngPath)) {
        console.log(`Renaming ${name}.png to ${name}.jpg`);
        try {
            fs.renameSync(pngPath, jpgPath);
        } catch (e) {
            console.error(`Failed to rename ${name}.png:`, e);
        }
    } else {
        console.log(`${name}.png not found!`);
    }
});
