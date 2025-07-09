// nexus.js - v5 Final (Corrected Structure)

import express from 'express';
import { exec } from 'child_process';
import path from 'path';

const app = express();
const port = 8081;

// Define project paths correctly
const __dirname = path.dirname(new URL(import.meta.url).pathname.substring(1));
const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(PROJECT_ROOT, 'MyOSPlanning', 'Data');

app.use(express.json());

// --- ROUTES ---

// A simple status route
app.get('/', (req, res) => {
  res.send('Nexus Orchestrator is online and awaiting commands.');
});

// The command execution endpoint
app.get('/api/v1/exec', (req, res) => {
    const command = req.query.cmd;
    if (!command) {
        return res.status(400).json({ error: 'No command provided. Use ?cmd=...' });
    }

    const commandAllowlist = ['npm', 'git', 'python', 'node'];
    const baseCommand = command.split(' ')[0];
    if (!commandAllowlist.includes(baseCommand)) {
        return res.status(403).json({ error: `Command not allowed: ${baseCommand}` });
    }

    console.log(`[Nexus]: Executing allowed command: "${command}"`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[Nexus]: Execution error: ${error.message}`);
            return res.status(500).json({ error: error.message, details: stderr });
        }
        res.status(200).json({ output: stdout });
    });
});

// The memory query endpoint
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
    console.log(`[Nexus]: Executing memory query with command: "${command}"`);

    exec(command, (error, stdout, stderr) => {
        if (error && error.code !== 1) {
            console.error(`[Nexus]: Query error: ${error.message}`);
            return res.status(500).json({ error: error.message, details: stderr });
        }
        const files = stdout.trim().split(/\r?\n/).filter(f => f);
        console.log(`[Nexus]: Query successful. Found ${files.length} matching files.`);
        res.status(200).json({
            searchTerm: sanitizedTerm,
            matches: files.length,
            files: files
        });
    });
});

// --- SERVER START ---
app.listen(port, () => {
  console.log(`[Nexus] Orchestrator listening on http://localhost:${port}`);
});