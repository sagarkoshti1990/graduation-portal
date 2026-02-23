const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Parse URL - remove query string and hash for file path resolution
  // Extract just the pathname (before ? or #) and decode it to handle special characters
  const urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  
  // Determine file path
  let filePath;
  if (urlPath === '/' || urlPath === '') {
    filePath = path.join(DIST_DIR, 'index.html');
  } else {
    // Remove leading slash and join with dist directory
    filePath = path.join(DIST_DIR, urlPath.startsWith('/') ? urlPath.slice(1) : urlPath);
  }
  
  // Security: prevent directory traversal
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Check if file exists
  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      // File doesn't exist - serve index.html for SPA routing
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, data) => {
        if (readErr) {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
      return;
    }

    // File exists - serve it
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Server Error');
      } else {
        const headers = { 'Content-Type': contentType };
        
        // For PDF and DOCX files, add Content-Disposition header to force download
        if (extname === '.pdf' || extname === '.docx' || extname === '.doc') {
          const filename = path.basename(filePath);
          headers['Content-Disposition'] = `attachment; filename="${filename}"`;
        }
        
        res.writeHead(200, headers);
        res.end(data);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${DIST_DIR}`);
});

