// MyServer.js - v6 (Pillar-Driven Architecture)

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import DesktopAgent from './/scripts/desktop_agent.js';
// --- Constants ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, 'MyOSPlanning', 'Data');

const app = express();
const port = 8081;

// --- Pillar-Command Mapping ---
const pillarCommands = {
    '0': 'rm', '1': 'node', '2': 'grep', '3': 'npm', '4': 'curl',
    '5': 'git', '6': 'npm update', '7': 'python', '8': 'diff', '9': 'docker'
};
const commandAllowlist = Object.values(pillarCommands).map(cmd => cmd.split(' ')[0]);

// --- Middleware ---
app.use(express.json());

// --- API Routes ---
app.get('/', (req, res) => res.send('MyServer Orchestrator is online.'));
app.get('/api/v1/pillars', (req, res) => res.status(200).json(pillarCommands));

app.get('/api/v1/exec', (req, res) => {
    const command = req.query.cmd;
    if (!command) return res.status(400).json({ error: 'No command provided via ?cmd=' });
    
    const baseCommand = command.split(' ')[0];
    if (!commandAllowlist.includes(baseCommand)) {
        return res.status(403).json({ error: `Command not allowed: ${baseCommand}` });
    }

    console.log(`[MyServer]: Executing: "${command}"`);
    exec(command, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: error.message, details: stderr });
        res.status(200).json({ output: stdout });
    });
});

app.get('/api/v1/memory/query', (req, res) => {
    const queryPath = req.query.path;
    if (!queryPath) return res.status(400).json({ error: 'No path provided via ?path=' });

    const command = `dir /s /b "${queryPath}"`;
    console.log(`[MyServer]: Executing index query: "${command}"`);
    exec(command, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: error.message, details: stderr });
        const files = stdout.trim().split(/\r?\n/).filter(f => f);
        res.status(200).json({ path: queryPath, matches: files.length, files: files });
    });
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`[MyServer] Orchestrator listening on http://localhost:${port}`);
		
	const myOSAgent = new DesktopAgent('C:\\MyOS'); // Tell it which directory to watch
myOSAgent.startMonitoring(); // Start the agent's monitoring cycle
}); // This closes the app.listen() callback function