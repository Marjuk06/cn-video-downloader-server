/* eslint-env node */
const express = require('express');
const cors = require('cors');
const ytDlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log("✅ Using ffmpeg-static at:", ffmpegPath);

// Check if cookies exist
const cookiesPath = path.join(__dirname, 'cookies.txt');
if (fs.existsSync(cookiesPath)) {
    console.log("✅ Cookies file found! YouTube bot protection bypassed.");
} else {
    console.log("⚠️ No cookies.txt found! YouTube might block downloads.");
}

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            ffmpegLocation: ffmpegPath,
            format: 'all',
            rmCacheDir: true, // Clears blocked session memory
            extractorArgs: 'youtube:player_client=ios' // Strictly uses iOS client
        };

        // Use cookies if available
        if (fs.existsSync(cookiesPath)) options.cookies = cookiesPath;

        const info = await ytDlp(url, options);
        const formats = [];

        const audioFormats = info.formats ? info.formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none') : [];
        if (audioFormats.length > 0) {
            const bestAudio = audioFormats[audioFormats.length - 1];
            formats.push({ quality: 'Audio', type: 'audio/mp3', url: url, size: bestAudio.filesize ? (bestAudio.filesize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown', height: 0 });
        }

        const seenResolutions = new Set();
        if (info.formats) {
            info.formats.forEach(f => {
                if (f.vcodec !== 'none' && f.vcodec !== undefined) {
                    const quality = f.height ? `${f.height}p` : (f.resolution || 'HD');
                    if (!seenResolutions.has(quality) && quality !== 'audio only') {
                        seenResolutions.add(quality);
                        formats.push({ quality: quality, type: `video/${f.ext || 'mp4'}`, url: url, size: f.filesize ? (f.filesize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown', height: f.height || 0 });
                    }
                }
            });
        }

        if (formats.length === 0 && info.url) {
            formats.push({ quality: 'HD Video', type: 'video/mp4', url: url, size: 'Unknown', height: 0 });
        }

        res.json({
            id: info.id,
            title: info.title || 'Video',
            thumbnail: info.thumbnail,
            duration: info.duration ? new Date(info.duration * 1000).toISOString().substr(11, 8) : '--:--',
            channel: info.uploader || info.extractor,
            formats: formats
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch video info. YouTube might be blocking the IP.' });
    }
});

app.get('/api/download', async (req, res) => {
    const { ytUrl, quality, title, start, end, bitrate } = req.query;
    if (!ytUrl) return res.status(400).send('No URL provided');

    if (start || end) {
        if (!start || !end) return res.status(400).send('Both start and end times are required for trimming.');
    }

    const safeTitle = (title || 'CN_Download').replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, '_');
    const isAudio = quality === 'Audio';
    const ext = isAudio ? 'mp3' : 'mp4';
    const trimMarker = (start && end) ? `_trim` : '';
    const fileName = `${safeTitle}${trimMarker}_${Date.now()}.${ext}`;
    const filePath = path.join(__dirname, fileName);

    const ytDlpOptions = {
        format: isAudio ? 'bestaudio' : (quality && quality !== 'HD Video' && quality !== 'HD' ? `bestvideo[height<=${quality.replace('p', '')}]+bestaudio/best` : 'bestvideo+bestaudio/best'),
        output: filePath,
        ffmpegLocation: ffmpegPath,
        noWarnings: true,
        rmCacheDir: true, // Clears blocked session memory
        extractorArgs: 'youtube:player_client=ios' // Strictly uses iOS client
    };

    // Use cookies if available
    if (fs.existsSync(cookiesPath)) ytDlpOptions.cookies = cookiesPath;

    if (start && end) {
        ytDlpOptions.downloadSections = `*${start}-${end}`;
        ytDlpOptions.forceKeyframesAtCuts = true;
    }

    if (isAudio) {
        ytDlpOptions.extractAudio = true;
        ytDlpOptions.audioFormat = 'mp3';
        ytDlpOptions.audioQuality = bitrate ? bitrate.replace('k', '') + 'K' : '320K';
    } else {
        ytDlpOptions.mergeOutputFormat = 'mp4';
    }

    try {
        res.header('Content-Disposition', `attachment; filename="${safeTitle}.${ext}"`);
        await ytDlp(ytUrl, ytDlpOptions);
        res.download(filePath, `${safeTitle}.${ext}`, (err) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (!res.headersSent) res.status(500).send('Download processing failed');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});