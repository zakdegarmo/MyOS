// =======================================================================
// === FILE: index.js (Scroll Server - Communication Bridge & Ear) ===
// =======================================================================
// This version connects to the OBS-Gemini-Bridge via Socket.IO,
// listening for visual context and feeding it into Mystra's brain.

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import io from 'socket.io-client'; // Import the socket.io client

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for the .env file in the project root directory
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });


// Import the Mystra LLM Core (the brain!)
import { initializeMystra, getMystraResponse, updateVisualContext, extractFunctionsFromCode } from './MystraBrain/mystra_llm_core.js';

// --- Configuration ---
const PORT = process.env.PORT || 8080;
const OBS_BRIDGE_URL = 'http://localhost:8000'; // The address of the EYES

// --- Initialize Express App ---
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increase limit for sending code


// --- Socket.IO Client Setup (The EAR) ---
const socket = io(OBS_BRIDGE_URL);

socket.on('connect', () => {
    console.log(`[Scroll Server] Connected to OBS-Gemini-Bridge at ${OBS_BRIDGE_URL}. Listening for visual context...`);
});

socket.on('disconnect', () => {
    console.log('[Scroll Server] Disconnected from OBS-Gemini-Bridge.');
});

// THIS IS THE CORE INTEGRATION:
// When a 'new_context' event is heard from the eyes,
// update the brain's short-term visual memory.
socket.on('new_context', (data) => {
    console.log(`[Scroll Server] Visual context received: "${data.text.substring(0, 70)}..."`);
    updateVisualContext(data.text); // Feed the context to Mystra's brain
});


// --- Initialize Mystra LLM Core (The BRAIN) ---
initializeMystra()
    .then(() => console.log('[Scroll Server] Mystra LLM Core initialized on backend.'))
    .catch(err => console.error('[Scroll Server] Failed to initialize Mystra LLM Core on backend:', err));

// --- Static File Serving ---
// Serve the main frontend application from the frontend directory
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));


// --- Routes ---
app.get('/ping', (req, res) => {
    console.log('[Scroll Server] /ping received.');
    res.status(200).send('pong');
});

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        console.log(`[Scroll Server] Received chat message: "${userMessage}"`);

        if (!userMessage) {
            return res.status(400).json({ error: 'Message content is required.' });
        }

        const mystraResponse = await getMystraResponse(userMessage);

        res.json({ reply: mystraResponse });

    } catch (error) {
        console.error('[Scroll Server] Error processing chat request in /chat endpoint:', error);
        res.status(500).json({ error: `Failed to get response from Mystra LLM Core: ${error.message}` });
    }
});

app.post('/extract-functions', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Code content is required for analysis.' });
        }
        console.log(`[Scroll Server] Received request to extract functions from code.`);
        const functions = await extractFunctionsFromCode(code);
        res.json(functions);
    } catch (error) {
        console.error(`[Scroll Server] Error in /extract-functions: ${error.message}`);
        res.status(500).json({ error: `Function extraction failed: ${error.message}`});
    }
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`[Scroll Server] Mystra Communication Bridge listening on port ${PORT}`);
    console.log(`[Scroll Server] Local URL (if running locally): http://localhost:${PORT}`);
});