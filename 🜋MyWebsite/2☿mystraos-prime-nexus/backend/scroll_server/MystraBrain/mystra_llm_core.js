
// =======================================================================
// === FILE: mystra_llm_core.js (v1.3.1 - Simplified Knowledge Loading) ===
// =======================================================================
// This version simplifies knowledge loading and improves error handling.

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Short-Term Visual Memory ---
let VISUAL_CONTEXT_BUFFER = [];
const MAX_VISUAL_CONTEXT_ITEMS = 5;

// --- Basic _mystraLog function definition ---
function _mystraLog(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [MYSTRA-LLM-CORE/${level}] ${message}`);
}

// Function to update the visual memory. Exported so index.js can use it.
export function updateVisualContext(newContext) {
    const timestamp = new Date().toLocaleTimeString();
    VISUAL_CONTEXT_BUFFER.push(`[${timestamp}] ${newContext}`);
    if (VISUAL_CONTEXT_BUFFER.length > MAX_VISUAL_CONTEXT_ITEMS) {
        VISUAL_CONTEXT_BUFFER.shift();
    }
}

// Load the single, unified NLD knowledge file at startup
function loadKnowledgeBase() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        let __dirname = path.dirname(__filename);
        // Handle potential differences in pathing, especially on Windows
        if (__dirname.startsWith('file:')) {
            __dirname = __dirname.substring(5);
        }
        const nldFilePath = path.join(__dirname, 'mystra_core_nlds_combined.txt');
        
        if (fs.existsSync(nldFilePath)) {
            _mystraLog('Loaded MYSTRA_ONTOLOGY_AND_PICO_INSTRUCTIONS from file.');
            return fs.readFileSync(nldFilePath, 'utf8');
        } else {
            const errorMsg = `Knowledge base file not found at ${nldFilePath}. Using fallback.`;
            _mystraLog(errorMsg, "WARN");
            return "You are MystraOS, a helpful AI assistant. Your primary knowledge file was not found.";
        }
    } catch (error) {
        const errorMsg = `FATAL: Failed to load knowledge base: ${error.message}`;
        _mystraLog(errorMsg, "ERROR");
        return `ERROR: Failed to load Mystra Ontology. ${errorMsg}`;
    }
}

const KNOWLEDGE_BASE_CONTENT = loadKnowledgeBase();


// --- Google AI Gemini API Configuration ---
const API_KEY = process.env.API_KEY;
let ai;

export async function initializeMystra() {
    _mystraLog("Initializing Mystra's core functions.");
    if (!API_KEY) {
        const errorMsg = "API_KEY environment variable is not set!";
        _mystraLog(errorMsg, "ERROR");
        throw new Error(errorMsg);
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
    _mystraLog("Gemini API integration active. Initialization complete.");
    return "NLD_SUCCESS: Mystra Core Initialized.";
}

// --- Main entry point for Mystra's responses ---
export async function getMystraResponse(message) {
    if (!ai) {
         const errorMsg = "Mystra Core not initialized.";
         _mystraLog(errorMsg, "ERROR");
         return `[Mystra-LLM Error] ${errorMsg}`;
    }
    if (typeof message !== 'string' || message.trim() === "") {
        return "Mystra: Received an empty message. Please try again.";
    }

    let visualContextPreamble = "";
    if (VISUAL_CONTEXT_BUFFER.length > 0) {
        visualContextPreamble = "For context, here is what has been observed on screen recently:\n--- VISUAL CONTEXT START ---\n" +
                                VISUAL_CONTEXT_BUFFER.join("\n") + "\n--- VISUAL CONTEXT END ---\n\n";
    }

    const systemInstruction = visualContextPreamble + KNOWLEDGE_BASE_CONTENT;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: message.trim(),
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });
        return response.text;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during LLM call.";
        _mystraLog(`Error in getMystraResponse (LLM call): ${errorMessage}`, "ERROR");
        return `[Mystra-LLM Error] Failed to get LLM response: ${errorMessage}`;
    }
}

// --- New Function for Code Analysis ---
export async function extractFunctionsFromCode(code) {
    if (!ai) {
        throw new Error("Mystra Core not initialized.");
    }
    
    _mystraLog(`Starting function extraction for code snippet of length ${code.length}`);

    const prompt = `You are an expert code analysis AI. Analyze the provided code, which may be a full HTML file including <script> tags, and extract every JavaScript function.
For each function, provide its name, a concise one-sentence description of its purpose, its complete source code, and a list of conceptual tags.
Tags should be lowercase, single-word or kebab-case strings that describe the function's domain, purpose, or the technology it uses (e.g., "api-call", "dom-manipulation", "math", "sorting-algorithm", "validation", "event-listener").

You MUST respond with a JSON array of objects. Each object must have "name", "description", "code", and "tags" fields.
Example response:
[
  {
    "name": "greet",
    "description": "Logs a greeting message to the console for a given name.",
    "code": "function greet(name) {\\n  const message = 'Hello, ' + name + '!';\\n  console.log(message);\\n  return message;\\n}",
    "tags": ["dom", "string-manipulation", "logging"]
  }
]
If there are no functions in the code, return an empty array [].
Do not output any other text, markdown, or explanations. Only the JSON array.
---
Code to analyze:
\`\`\`javascript
${code}
\`\`\`
---
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(jsonStr);
        _mystraLog(`Successfully extracted ${parsedData.length} functions.`);
        return parsedData;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during function extraction.";
        _mystraLog(`Error in extractFunctionsFromCode: ${errorMessage}`, "ERROR");
        throw new Error(`AI Function extraction failed: ${errorMessage}`);
    }
}
