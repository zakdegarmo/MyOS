// =======================================================================
// === FILE: nld_scroll_server.js (MystraOS Local NLD Scroll Server MVP v0.1) ===
// =======================================================================
// Purpose: A simple Node.js HTTP server to serve NLD JSON files from the root
//          and archive files (JSON or TXT) from the 'mystra_archives' subdirectory.
// Usage: Run from the MystraDesk root directory: `node nld_scroll_server.js`
// Then access files via browser or GET requests:
//   e.g., http://localhost:8081/NLD_Semantic_Primitives.json
//   e.g., http://localhost:8081/mystra_archives/your_archive_file.txt
// =======================================================================

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const PORT = 8081;
const HOSTNAME = 'localhost';

// Define allowed base directories for security
const ROOT_DIR = __dirname; // Serves files from the script's directory (MystraDesk root)
const ARCHIVES_DIR_NAME = 'mystra_archives';
const ARCHIVES_DIR = path.join(__dirname, ARCHIVES_DIR_NAME);

const MIME_TYPES = {
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    // Add more as needed
};

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    let filePath = decodeURIComponent(requestUrl.pathname); // Decode URL-encoded characters like %20

    console.log(`[ScrollServer] Received request for: ${filePath}`);

    // Basic security: Prevent directory traversal
    if (filePath.includes('..')) {
        console.warn(`[ScrollServer] Attempted directory traversal: ${filePath}`);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('400 Bad Request: Invalid path component.');
        return;
    }

    let fullFilePath;
    // Determine if the request is for an archive or a root file
    if (filePath.startsWith(`/${ARCHIVES_DIR_NAME}/`)) {
        // Request is for a file in the archives directory
        const archiveFileName = filePath.substring(`/${ARCHIVES_DIR_NAME}/`.length);
        fullFilePath = path.join(ARCHIVES_DIR, archiveFileName);
    } else {
        // Request is for a file in the root directory
        fullFilePath = path.join(ROOT_DIR, filePath);
    }

    // Normalize the path to prevent issues
    fullFilePath = path.normalize(fullFilePath);

    // Security check: Ensure the normalized path is still within the intended directories
    if (!fullFilePath.startsWith(ROOT_DIR) && !fullFilePath.startsWith(ARCHIVES_DIR)) {
         console.warn(`[ScrollServer] Attempted access outside designated directories: ${fullFilePath} (original: ${filePath})`);
         res.writeHead(403, { 'Content-Type': 'text/plain' });
         res.end('403 Forbidden: Access denied.');
         return;
    }
    
    // Ensure it's not trying to access a directory itself (simple check)
    if (filePath.endsWith('/')) {
        console.warn(`[ScrollServer] Attempted directory listing: ${filePath}`);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden: Directory listing not allowed.');
        return;
    }


    try {
        const data = await fs.readFile(fullFilePath, 'utf8');
        const ext = path.extname(fullFilePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
        console.log(`[ScrollServer] Served: ${fullFilePath} as ${contentType}`);

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`[ScrollServer] File not found: ${fullFilePath}`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            console.error(`[ScrollServer] Error reading file ${fullFilePath}:`, error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
        }
    }
});

server.listen(PORT, HOSTNAME, () => {
    console.log(`[ScrollServer] Mystra's NLD Scroll Server MVP v0.1 running at http://${HOSTNAME}:${PORT}/`);
    console.log(`[ScrollServer] Serving files from root: ${ROOT_DIR}`);
    console.log(`[ScrollServer] And archives from: ${ARCHIVES_DIR}`);
    console.log(`[ScrollServer] Test with: http://${HOSTNAME}:${PORT}/NLD_Semantic_Primitives.json`);
    console.log(`[ScrollServer] Or: http://${HOSTNAME}:${PORT}/mystra_archives/your_archive.txt (if it exists)`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[ScrollServer] ERROR: Port ${PORT} is already in use. Please choose a different port or stop the other application.`);
    } else {
        console.error('[ScrollServer] Server error:', err);
    }
    process.exit(1); // Exit if server can't start
});