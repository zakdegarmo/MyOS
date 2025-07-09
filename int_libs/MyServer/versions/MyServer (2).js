// MyServer.js - v6 (Pillar-Driven Architecture)

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Constants ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(PROJECT_ROOT, 'MyOSPlanning', 'Data');

const app = express();
const port = 8081;

// --- Pillar-Command Mapping ---
const pillarCommands = {
    '0': 'rm',
    '1': 'node',
    '2': 'grep',
    '3': 'npm',
    '4': 'curl',
    '5': 'git',
    '6': 'npm update',
    '7': 'python',
    '8': 'diff',
    '9': 'docker build'
};
const commandAllowlist = Object.values(pillarCommands);


// --- Middleware ---
app.use(express.json());


// --- API Routes ---

// Root status endpoint
app.get('/', (req, res) => {
  res.send('MyServer Orchestrator is online. The system is cohesive.');
});

// New endpoint to see the pillar mapping
app.get('/api/v1/pillars', (req, res) => {
    res.status(200).json(pillarCommands);
});

// The command execution endpoint, now secured by the pillar mapping
app.get('/api/v1/exec', (req, res) => {
    const command = req.query.cmd;
    if (!command) {
        return res.status(400).json({ error: 'No command provided. Use ?cmd=...' });
    }

    const baseCommand = command.split(' ')[0];
    if (!commandAllowlist.includes(baseCommand)) {
        return res.status(403).json({ error: `Command not allowed: ${baseCommand}` });
    }

    console.log(`[MyServer]: Executing Pillar-aligned command: "${command}"`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: error.message, details: stderr });
        }
        res.status(200).json({ output: stdout });
    });
});

// The memory query endpoint remains the same
app.get('/api/v1/memory/query', (req, res) => {
    const searchTerm = req.query.term;
    if (!searchTerm) {
        return res.status(400).json({ error: 'No search term provided. Use ?term=...' });
    }
    const sanitizedTerm = searchTerm.replace(/[^a-zA-Z0-9\s-]/g, '');
    if (sanitizedTerm.length === 0) {
        return res.status(400).json({ error: 'Invalid search term.' });
    }
    
    const command = `findstr /i /m "${sanitizedTerm}" "${path.join(DATA_PATH, '*.md')}"`;
    console.log(`[MyServer]: Executing memory query: "${command}"`);
    exec(command, (error, stdout, stderr) => {
        if (error && error.code !== 1) {
            return res.status(500).json({ error: error.message, details: stderr });
        }
        const files = stdout.trim().split(/\r?\n/).filter(f => f);
        res.status(200).json({ searchTerm: sanitizedTerm, matches: files.length, files: files });
    });
});


// --- Server Start ---
app.listen(port, () => {
  console.log(`[MyServer] Orchestrator listening on http://localhost:${port}`);
});