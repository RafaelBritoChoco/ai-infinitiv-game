const fs = require('fs');
const https = require('https');
const path = require('path');

const download = (url, dest) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close();
            console.log('Downloaded ' + dest);
        });
    }).on('error', function (err) {
        fs.unlink(dest);
        console.error('Error downloading ' + dest + ': ' + err.message);
    });
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

download('https://placehold.co/192x192.png', path.join(publicDir, 'pwa-192x192.png'));
download('https://placehold.co/512x512.png', path.join(publicDir, 'pwa-512x512.png'));
