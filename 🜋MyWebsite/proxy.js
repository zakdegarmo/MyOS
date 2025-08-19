import fs from 'fs/promises';

const PORT = 3000;
const INDEX_HTML_PATH = './DungeonNexus9.html';

// The server's logic (The ♀DOOR)
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // This is the router, the logic that handles incoming requests
    // from the Ngrok tunnel and routes them to the correct local server.
    if (url.pathname === '/') {
      try {
        const file = await Bun.file(INDEX_HTML_PATH);
        return new Response(file, {
          status: 200,
          headers: {
            'Content-Type': file.type,
          },
        });
      } catch (err) {
        return new Response('404 Not Found', { status: 404 });
      }
    } else if (url.pathname.startsWith('/myontology')) {
      // This is a direct redirect to an external URL, not a proxy fetch
      return Response.redirect("https://zakdegarmo.github.io/MyOntology/", 302);
    } else if (url.pathname.startsWith('/7')) {
      const atom_url = 'https://localhost:3700' + url.pathname;
      return fetch(atom_url, { headers: req.headers });
    } else if (url.pathname.startsWith('/8')) {
      const ttf_url = ' https://localhost:3800' + url.pathname.substring(4);
      return fetch(ttf_url, { headers: req.headers });
    } else if (url.pathname.startsWith('/9')) {
      const hap_url = 'http://localhost:3900' + url.pathname.substring(4);
      return fetch(hap_url, { headers: req.headers });
    } else {
      return new Response('404 Not Found', { status: 404 });
    }
  },
});

console.log(`The ♀DOOR is open at http://localhost:${server.port}`);
console.log(`This server handles all requests for the 🜍DOOR`);