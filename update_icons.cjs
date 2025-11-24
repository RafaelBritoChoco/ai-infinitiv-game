const fs = require('fs');
const path = require('path');

const sourcePath = 'C:/Users/rafae/.gemini/antigravity/brain/632dccfa-095e-455b-afba-bff7be420e01/glitch_rocket_icon_1763912216597.png';
const dest192 = path.join(__dirname, 'public', 'pwa-192x192.png');
const dest512 = path.join(__dirname, 'public', 'pwa-512x512.png');

try {
    fs.copyFileSync(sourcePath, dest192);
    fs.copyFileSync(sourcePath, dest512);
    console.log('Icons updated successfully!');
} catch (err) {
    console.error('Error copying icons:', err);
    process.exit(1);
}
