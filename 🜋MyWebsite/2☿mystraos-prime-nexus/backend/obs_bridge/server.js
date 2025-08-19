require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const NodeMediaServer = require('node-media-server');
const ffmpeg = require('fluent-ffmpeg');
const { GoogleGenAI } = require('@google/genai');
const { Writable } = require('stream');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const path = require('path');

// --- Configuration ---
const CAPTURE_INTERVAL_SECONDS = parseInt(process.env.CAPTURE_INTERVAL_SECONDS, 10) || 60;
const CAPTURE_INTERVAL = CAPTURE_INTERVAL_SECONDS * 1000;
const HTTP_PORT = 8000;

// --- Initialization ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow connections from any origin
        methods: ["GET", "POST"]
    }
});

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.error("[ERROR] API_KEY not found. Please create a .env file.");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Express & Socket.IO Setup ---
// Serve a simple HTML page for monitoring context, from this directory
app.use(express.static(path.join(__dirname))); 

io.on('connection', (socket) => {
    console.log('[Socket.IO] A client connected.');
    socket.on('disconnect', () => {
        console.log('[Socket.IO] A client disconnected.');
    });
});

// --- Node Media Server Setup ---
const nmsConfig = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    logType: 1 // 1=error, 2=info, 3=debug
};
const nms = new NodeMediaServer(nmsConfig);
const streamIntervals = new Map();

// --- Core Logic ---
nms.on('postPublish', async (id, StreamPath, args) => {
    const rtmpUrl = `rtmp://localhost${StreamPath}`;
    console.log(`\n[NMS] Stream '${StreamPath}' published. Starting periodic frame capture.`);
    
    if (streamIntervals.has(StreamPath)) {
        clearInterval(streamIntervals.get(StreamPath));
    }

    const intervalId = setInterval(async () => {
        const timestamp = new Date().toLocaleTimeString();
        let imageBuffer = Buffer.from([]);
        const imageWritableStream = new Writable({
            write: (chunk, _, cb) => {
                imageBuffer = Buffer.concat([imageBuffer, chunk]);
                cb();
            }
        });

        try {
            await new Promise((resolve, reject) => {
                ffmpeg(rtmpUrl)
                    .inputOptions(['-y', '-loglevel', 'error', '-f', 'flv'])
                    .outputOptions(['-vframes', '1', '-f', 'image2pipe', '-vcodec', 'png', '-q:v', '2'])
                    .on('error', (err) => reject(new Error(`FFmpeg capture error: ${err.message}`)))
                    .on('end', () => resolve())
                    .pipe(imageWritableStream, { end: true });
            });

            if (imageBuffer.length === 0) return;

            const base64Image = imageBuffer.toString('base64');
            const imagePart = { inlineData: { mimeType: 'image/png', data: base64Image } };
            const prompt = "Describe this screen from a programmer's perspective. Focus on code, terminals, IDEs, browser developer tools, or relevant dev environment details. Be concise.";
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: { parts: [imagePart, { text: prompt }] },
            });
            
            const text = response.text;
            const contextData = { timestamp, text };
            
            // Step 1: Broadcast to all connected clients
            io.emit('new_context', contextData);

            // Step 2: Log to console for local visibility
            console.log(`[AI RESPONSE][${timestamp}] ${text}`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            console.error(`[ERROR][${timestamp}] ❌ ${errorMessage}`);
            // Broadcast the error to the UI
            io.emit('api_error', { timestamp, message: errorMessage });
        }
    }, CAPTURE_INTERVAL);

    streamIntervals.set(StreamPath, intervalId);
});

nms.on('donePublish', (id, StreamPath, args) => {
    console.log(`[NMS] Stream '${StreamPath}' stopped.`);
    if (streamIntervals.has(StreamPath)) {
        clearInterval(streamIntervals.get(StreamPath));
        streamIntervals.delete(StreamPath);
    }
});

// --- Server Startup ---
nms.run(); // Start RTMP server
server.listen(HTTP_PORT, () => {
    console.log('----------------------------------------------------');
    console.log('[SYSTEM] Mystra Context Publisher is running.');
    console.log(`[SYSTEM] Capture interval set to ${CAPTURE_INTERVAL_SECONDS} seconds.`);
    console.log(`[RTMP] Listening on: rtmp://localhost:${nmsConfig.rtmp.port}`);
    console.log(`[HTTP] Context Monitor UI available at: http://localhost:${HTTP_PORT}`);
    console.log('[SYSTEM] Waiting for OBS stream to publish context...');
    console.log('----------------------------------------------------');
});