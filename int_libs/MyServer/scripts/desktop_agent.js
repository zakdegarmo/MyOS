// desktop_agent.js
// A dedicated agent to monitor the filesystem for self-describing Nexus Folders.

import fs from 'node:fs/promises';
import path from 'node:path';
import ini from 'ini'; // To parse .ini files
import { parseStringPromise } from 'xml2js'; // To parse SVG/XML files

class DesktopAgent {
    /**
     * @param {string} rootPath The root directory to monitor.
     */
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.intervalId = null;
        this.processedFiles = new Map(); // A simple cache to avoid reprocessing unchanged files
    }

    /**
     * Starts monitoring the directory at a specified interval.
     * @param {number} pollInterval Time in milliseconds between each scan.
     */
    startMonitoring(pollInterval = 10000) { // Default to every 10 seconds
        console.log(`[DesktopAgent] Awakening. Monitoring directory: ${this.rootPath}`);
        this.intervalId = setInterval(() => {
            this._scanDirectory(this.rootPath);
        }, pollInterval);
    }

    /**
     * Stops the monitoring process.
     */
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            console.log('[DesktopAgent] Monitoring stopped.');
        }
    }

    /**
     * Recursively scans a directory for desktop.ini files.
     * @param {string} directoryPath The path of the directory to scan.
     * @private
     */
    async _scanDirectory(directoryPath) {
        try {
            const entries = await fs.readdir(directoryPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(directoryPath, entry.name);
                if (entry.isDirectory()) {
                    // It's a directory, so we'll scan it for a desktop.ini
                    this._processFolder(fullPath);
                }
            }
        } catch (error) {
            console.error(`[DesktopAgent] Error scanning directory ${directoryPath}:`, error);
        }
    }
    
    /**
     * Processes a single folder to check for our special icon.
     * @param {string} folderPath The path of the folder to process.
     * @private
     */
    async _processFolder(folderPath) {
        const iniPath = path.join(folderPath, 'desktop.ini');
        try {
            const iniStats = await fs.stat(iniPath);
            const lastModified = iniStats.mtimeMs;

            // Check our cache to see if we've already processed this version of the file
            if (this.processedFiles.has(iniPath) && this.processedFiles.get(iniPath) === lastModified) {
                return; // Skip if it hasn't changed
            }

            const iniContent = await fs.readFile(iniPath, 'utf-8');
            const config = ini.parse(iniContent);

            // The section containing icon information
            const shellClassInfo = config['.ShellClassInfo'];
            if (shellClassInfo && shellClassInfo.IconFile && shellClassInfo.IconFile.includes('nexus_folder')) {
                console.log(`[DesktopAgent] Found Nexus Folder at: ${folderPath}`);
                await this._extractMetadataFromIcon(folderPath, shellClassInfo.IconFile);
            }
            
            // Update the cache with the new modification time
            this.processedFiles.set(iniPath, lastModified);

        } catch (error) {
            // This will error if desktop.ini doesn't exist, which is normal. We can ignore it.
            if (error.code !== 'ENOENT') {
                 console.error(`[DesktopAgent] Error processing folder ${folderPath}:`, error);
            }
        }
    }
    
    /**
     * Reads the specified SVG icon file and extracts the embedded metadata.
     * @param {string} folderPath The path of the folder containing the icon.
     * @param {string} iconPath The path to the SVG icon file from the .ini.
     * @private
     */
    async _extractMetadataFromIcon(folderPath, iconPath) {
        // Resolve the full path to the SVG (it might be relative)
        const fullIconPath = path.resolve(folderPath, iconPath);
        try {
            const svgContent = await fs.readFile(fullIconPath, 'utf-8');
            
            // Parse the SVG XML content into a JavaScript object
            const parsedSvg = await parseStringPromise(svgContent);

            // Navigate the parsed object to find our custom metadata
            const metadata = parsedSvg.svg.metadata[0]['rdf:RDF'][0]['rdf:Description'][0]['myos:Schema'][0];
            
            if (metadata) {
                // The metadata is stored as a CDATA block, so it's a string. We need to parse it as JSON.
                const schemaObject = JSON.parse(metadata);
                console.log(`[DesktopAgent]  > Extracted Schema from ${path.basename(fullIconPath)}:`, schemaObject);
                // Here, we would do something with the schema, like update the OS state.
            }

        } catch (error) {
            console.error(`[DesktopAgent]  > FAILED to extract metadata from ${fullIconPath}:`, error);
        }
    }
}

export default DesktopAgent;