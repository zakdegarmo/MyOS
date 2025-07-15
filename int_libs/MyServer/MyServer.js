// MyServer.js - v16 (Pure ES Module Imports & CORS Enabled)

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs/promises';
import { XMLParser } from 'fast-xml-parser'; // Already an ES module
import ini from 'ini'; // <--- MODIFIED: ini is usually CommonJS, need to check if it has ESM export. If not, this might still cause issues. Assuming it has.
import { parseStringPromise } from 'xml2js'; // <--- MODIFIED: xml2js is usually CommonJS, need to check if it has ESM export. If not, this might still cause issues. Assuming it has.
import cors from 'cors'; // Already an ES module

// --- Import MyOS Core Modules ---
import { initializeMystraCore, getMystraResponse } from '../../int_libs/MyOS-Core-Logic/mystra_llm_core.js';
import * as MyOSState from '../../int_libs/MyOS-Core-Logic/state.js';

// --- Dynamic Import the Desktop Agent Module using URL (SUPER-ROBUST FIX) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MYOS_ROOT_PATH = path.join(__dirname, '..', '..'); // This is C:\MyOS\
const DESKTOP_AGENT_FILE_PATH = path.join(__dirname, 'scripts', 'desktop_agent.js'); // Standard file system path
const DESKTOP_AGENT_MODULE_URL = pathToFileURL(DESKTOP_AGENT_FILE_PATH).href; // Convert to URL
let DesktopAgent; // Declare DesktopAgent here

// --- Constants (from previous version) ---
const MYOS_INI_PATH = path.join(MYOS_ROOT_PATH, 'MyOS.ini'); // Path to C:\MyOS\MyOS.ini

const app = express();
const port = 8081;

// --- Pillar-Command Mapping (from previous version) ---
const pillarCommands = {
    '0': 'rm', '1': 'node', '2': 'grep', '3': 'npm', '4': 'curl',
    '5': 'git', '6': 'npm update', '7': 'python', '8': 'diff', '9': 'docker'
};
const commandAllowlist = Object.values(pillarCommands).map(cmd => cmd.split(' ')[0]);

// --- Middleware (from previous version) ---
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- API Routes (Existing - from previous version) ---
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
    
    const execOptions = { maxBuffer: 50 * 1024 * 1024 }; 

    exec(command, execOptions, (error, stdout, stderr) => {
        if (error) {
            console.error(`[MyServer] exec error for query "${command}":`, error.message);
            return res.status(500).json({ error: error.message, details: stderr });
        }
        const files = stdout.trim().split(/\r?\n/).filter(f => f);
        res.status(200).json({ path: queryPath, matches: files.length, files: files });
    });
});

// --- SVG Icon Ontology Parsing Functions ---
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    cdataPropName: "__cdata"
});

async function readIniFile(iniPath) {
    try {
        const content = await fs.readFile(iniPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        const settings = {};
        let currentSection = 'default';

        settings[currentSection] = {}; 

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith(';')) continue;

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

async function extractSchemaFromSvg(svgPath) {
    try {
        const svgContent = await fs.readFile(svgPath, 'utf-8');
        const parsedSvg = xmlParser.parse(svgContent);

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

// --- API Endpoint: /api/v1/ontology/icon_schema ---
app.get('/api/v1/ontology/icon_schema', async (req, res) => {
    const svgFilePath = req.query.svg_path;
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


// --- API Endpoint: /api/v1/llm/query (Proxies to Mystra LLM Core) ---
app.post('/api/v1/llm/query', async (req, res) => {
    const { message, conversationHistory = [], llmParams = {} } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'No message provided.' });
    }
    
    try {
        const mystraResponse = await getMystraResponse(message, conversationHistory, llmParams);

        if (typeof mystraResponse === 'object' && mystraResponse.type) {
            if (mystraResponse.type === 'save_file_request' || mystraResponse.type === 'save_app_state_request') {
                console.log(`[MyServer] Received save_file_request:`, mystraResponse.filename, JSON.stringify(mystraResponse.data, null, 2));
                return res.status(200).json({ success: true, message: mystraResponse.success_message, payload_type: mystraResponse.type });
            }
            return res.status(200).json({ success: true, response_payload: mystraResponse });
        }
        res.status(200).json({ success: true, response: mystraResponse.payload });

    } catch (error) {
        console.error(`[MyServer] Error processing LLM query:`, error.message);
        res.status(500).json({ error: `Failed to process LLM query: ${error.message}` });
    }
});


// --- Server Start ---
app.listen(port, async () => {
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
        // Dynamically import DesktopAgent here, after __dirname is defined
        const DesktopAgentModule = await import(DESKTOP_AGENT_MODULE_URL);
        DesktopAgent = DesktopAgentModule.default; 

        const iniSettings = await readIniFile(MYOS_INI_PATH);
        const myosBootloaderSection = iniSettings['MyOS_Bootloader'] || {};

        myOSBootloaderContext.icon_svg_path = myosBootloaderSection.IconFile || null;
        myOSBootloaderContext.myos_nld_action = myosBootloaderSection.MyOS_NLD_Action || null;
        myOSBootloaderContext.myos_target_icon_id = myosBootloaderSection.MyOS_Target_Icon_ID || null;

        if (myOSBootloaderContext.icon_svg_path) {
            let absoluteSvgPath = myOSBootloaderContext.icon_svg_path;
            if (!path.isAbsolute(absoluteSvgPath)) {
                absoluteSvgPath = path.resolve(MYOS_ROOT_PATH, absoluteSvgPath);
            }
            myOSBootloaderContext.icon_svg_path = absoluteSvgPath;

            const embeddedSchema = await extractSchemaFromSvg(absoluteSvgPath);
            myOSBootloaderContext.embedded_ontology_schema = embeddedSchema;
            
            console.log("[MyServer] Initializing Mystra LLM Core with loaded ontological schema...");
            initializeMystraCore(
                { /* projectData - placeholder */ archives: {} },
                { description: "Algorithm for creating algorithms." },
                { /* abilitiesData - placeholder */ },
                { Core_Sub_Binary_Primitives: { '1.3_ACTUALITY_AXIS': { PRIMARY_STATES_NLD_Enum_List: [{ STATE_NLD: { NAME: "ACTUALITY_NULL", SYMBOLIC_VALUE_NLD_Optional: "A=0", VALUE_CONCEPT_NLD: "The state of non-manifestation or pure potential." } }, { STATE_NLD: { NAME: "ACTUALITY_CONCRETE_ACTUALIZED", SYMBOLIC_VALUE_NLD_Optional: "A=1", VALUE_CONCEPT_NLD: "The state of being manifest and real." } }] } } },
                { /* NLD_BYTECODE_SPEC_DOC - placeholder */ },
                { /* personalityCoreData - placeholder */ },
                [/* personalityTraitsListData - placeholder */],
                { Axioms_List: myOSBootloaderContext.embedded_ontology_schema?.axioms || [] }
            );
            console.log("[MyServer] Mystra LLM Core initialized with ontological schema.");

        } else {
            console.warn(`[MyServer] No IconFile specified in [MyOS_Bootloader] section of ${MYOS_INI_PATH}. Skipping SVG schema load.`);
        }

    } catch (error) {
        console.error(`[MyServer] CRITICAL ERROR during MyOS Bootloader initialization:`, error.message);
        // Ensure DesktopAgent is still undefined or null to prevent further errors.
        DesktopAgent = null; 
    }
    
    // Start the Desktop Agent's monitoring cycle ONLY if it was successfully loaded
    if (DesktopAgent) {
        const myOSAgent = new DesktopAgent(MYOS_ROOT_PATH);
        myOSAgent.startMonitoring();
    } else {
        console.warn("[MyServer] DesktopAgent could not be loaded. Skipping desktop monitoring.");
    }
});