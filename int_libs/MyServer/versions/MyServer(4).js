// MyServer.js - v8 (Ontological Bootloader & SVG Schema Parser)

import express from 'express';
import { exec } from 'child_process'; // Use require for exec for consistency or ensure proper import
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; // Use promises version for async/await file operations
import { XMLParser } from 'fast-xml-parser'; // Requires: npm install fast-xml-parser

// --- Constants ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assuming MyServer.js is now in C:\MyOS\int_libs\MyServer
// And MyOS root is C:\MyOS\
const MYOS_ROOT_PATH = path.join(__dirname, '..', '..'); // Goes up from int_libs/MyServer to MyOS
const MYOS_INI_PATH = path.join(MYOS_ROOT_PATH, 'MyOS.ini'); // Path to C:\MyOS\MyOS.ini

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

// --- NEW: SVG Icon Ontology Parsing Functions ---

const xmlParser = new XMLParser({
    ignoreAttributes: false, // Keep attributes like xmlns
    attributeNamePrefix: "@_", // Prefix for attributes
    textNodeName: "#text", // Name for text nodes
    cdataPropName: "__cdata" // Name for CDATA sections
});

/**
 * Reads an INI file and parses its sections and key-value pairs.
 * @param {string} iniPath - Full path to the INI file.
 * @returns {Promise<Object>} - A promise that resolves to an object representing INI sections.
 */
async function readIniFile(iniPath) {
    try {
        const content = await fs.readFile(iniPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        const settings = {};
        let currentSection = 'default'; // Default section if none specified

        settings[currentSection] = {}; // Initialize default section

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith(';')) continue; // Skip empty lines and comments

            const sectionMatch = trimmedLine.match(/^\[(.*?)\]$/);
            if (sectionMatch) {
                currentSection = sectionMatch[1];
                settings[currentSection] = {};
                continue;
            }

            const keyValueMatch = trimmedLine.match(/^([^=]+)=(.*)$/);
            if (keyValueMatch) {
                const key = keyValueMatch[1].trim();
                const value = keyValueMatch[2].trim();
                settings[currentSection][key] = value;
            }
        }
        return settings;
    } catch (error) {
        console.error(`[MyServer] Error reading INI file ${iniPath}:`, error.message);
        return {};
    }
}

/**
 * Reads an SVG file, parses its XML, and extracts the embedded MyOS conceptual schema.
 * Assumes schema is within <metadata><rdf:RDF><rdf:Description><myos:Schema><![CDATA[...]]]></myos:Schema>
 * @param {string} svgPath - Full path to the SVG file.
 * @returns {Promise<Object|null>} - A promise that resolves to the parsed schema object or null.
 */
async function extractSchemaFromSvg(svgPath) {
    try {
        const svgContent = await fs.readFile(svgPath, 'utf-8');
        const parsedSvg = xmlParser.parse(svgContent);

        // Navigate to the expected schema location in the parsed XML
        const metadata = parsedSvg?.svg?.metadata;
        const rdfDescription = metadata?.['rdf:RDF']?.['rdf:Description'];
        const myosSchemaBlock = rdfDescription?.['myos:Schema'];

        if (myosSchemaBlock && myosSchemaBlock.__cdata) {
            const schemaJsonString = myosSchemaBlock.__cdata;
            try {
                const schema = JSON.parse(schemaJsonString);
                return schema;
            } catch (jsonError) {
                console.error(`[MyServer] Error parsing embedded JSON schema from SVG ${svgPath}:`, jsonError.message);
                return null;
            }
        } else {
            console.warn(`[MyServer] No <myos:Schema> CDATA block found in SVG ${svgPath}.`);
            return null;
        }
    } catch (error) {
        console.error(`[MyServer] Error reading or parsing SVG file ${svgPath}:`, error.message);
        return null;
    }
}

// --- NEW API Endpoint: /api/v1/ontology/icon_schema ---
// This endpoint will be called by the UI or a desktop agent to get an SVG icon's embedded schema.
app.get('/api/v1/ontology/icon_schema', async (req, res) => {
    const svgFilePath = req.query.svg_path; // Expected: C:\Users\zakde\Desktop\SORTING\MyOS_Assets\Icons\my_test_icon.svg
    if (!svgFilePath) {
        return res.status(400).json({ error: 'No SVG file path provided via ?svg_path=' });
    }

    try {
        const schema = await extractSchemaFromSvg(svgFilePath);
        if (schema) {
            res.status(200).json({ success: true, schema: schema });
        } else {
            res.status(404).json({ success: false, message: "No schema found or SVG parsing failed." });
        }
    } catch (error) {
        console.error(`[MyServer] Error getting icon schema for ${svgFilePath}:`, error.message);
        res.status(500).json({ error: `Failed to retrieve icon schema: ${error.message}` });
    }
});


// --- Server Start ---
app.listen(port, async () => { // Made callback async to use await for ini/svg parsing
    console.log(`[MyServer] Orchestrator listening on http://localhost:${port}`);
    
    // --- MyOS Conceptual Bootloader Logic (FROM MyOS.ini and SVG) ---
    console.log(`[MyServer] Initiating MyOS conceptual bootloader via ${MYOS_INI_PATH}...`);
    let myOSBootloaderContext = {
        icon_svg_path: null,
        myos_nld_action: null,
        myos_target_icon_id: null,
        embedded_ontology_schema: null
    };

    try {
        const iniSettings = await readIniFile(MYOS_INI_PATH);
        const myosBootloaderSection = iniSettings['MyOS_Bootloader'] || {}; // Assuming the section is named [MyOS_Bootloader]

        myOSBootloaderContext.icon_svg_path = myosBootloaderSection.IconFile || null;
        myOSBootloaderContext.myos_nld_action = myosBootloaderSection.MyOS_NLD_Action || null;
        myOSBootloaderContext.myos_target_icon_id = myosBootloaderSection.MyOS_Target_Icon_ID || null;

        if (myOSBootloaderContext.icon_svg_path) {
            // Ensure SVG path is absolute if relative in INI
            let absoluteSvgPath = myOSBootloaderContext.icon_svg_path;
            if (!path.isAbsolute(absoluteSvgPath)) {
                // Assuming it's relative to MYOS_ROOT_PATH (C:\MyOS)
                absoluteSvgPath = path.resolve(MYOS_ROOT_PATH, absoluteSvgPath);
            }
            myOSBootloaderContext.icon_svg_path = absoluteSvgPath; // Store absolute path

            const embeddedSchema = await extractSchemaFromSvg(absoluteSvgPath);
            myOSBootloaderContext.embedded_ontology_schema = embeddedSchema;
        }

        console.log(`[MyServer] MyOS Bootloader Context Loaded:`, JSON.stringify(myOSBootloaderContext, null, 2));

        // ZAK: Here is where you would then call your mystra_llm_core.initializeMystraCore
        // with the loaded embedded_ontology_schema, etc.
        // E.g., await mystraCore.initializeMystraCore(myOSBootloaderContext.embedded_ontology_schema, ...);

    } catch (error) {
        console.error(`[MyServer] CRITICAL ERROR during MyOS Bootloader initialization:`, error.message);
    }
    // const myOSAgent = new DesktopAgent('C:\\MyOS'); // DesktopAgent needs to be defined/imported correctly
    // myOSAgent.startMonitoring(); // Start the agent's monitoring cycle
});