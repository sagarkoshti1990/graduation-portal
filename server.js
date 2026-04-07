const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const IMMUTABLE_ASSET_MAX_AGE = 31536000;
const STATIC_ASSET_MAX_AGE = 604800;

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
  '.webmanifest': 'application/manifest+json',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
};

const isImmutableAsset = filePath =>
  /\.[0-9a-f]{8,}\./i.test(path.basename(filePath));

const getCacheControl = filePath => {
  const fileName = path.basename(filePath);
  const extname = String(path.extname(filePath)).toLowerCase();

  if (fileName === 'index.html' || fileName === 'web-app-version.json') {
    return 'no-cache, no-store, must-revalidate';
  }

  if (extname === '.webmanifest') {
    return 'no-cache';
  }

  if (isImmutableAsset(filePath)) {
    return `public, max-age=${IMMUTABLE_ASSET_MAX_AGE}, immutable`;
  }

  if (['.js', '.css', '.png', '.jpg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.wasm'].includes(extname)) {
    return `public, max-age=${STATIC_ASSET_MAX_AGE}`;
  }

  return 'no-cache';
};

const getCompression = acceptEncoding => {
  const encodings = acceptEncoding || '';

  if (encodings.includes('br')) {
    return {
      encoding: 'br',
      stream: zlib.createBrotliCompress(),
    };
  }

  if (encodings.includes('gzip')) {
    return {
      encoding: 'gzip',
      stream: zlib.createGzip(),
    };
  }

  return null;
};

const sendFile = (req, res, filePath, contentType) => {
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': getCacheControl(filePath),
    'Vary': 'Accept-Encoding',
  };
  const extname = String(path.extname(filePath)).toLowerCase();

  if (extname === '.pdf' || extname === '.docx' || extname === '.doc') {
    const filename = path.basename(filePath);
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;
  }

  const compression = getCompression(req.headers['accept-encoding']);
  if (compression) {
    headers['Content-Encoding'] = compression.encoding;
  }

  res.writeHead(200, headers);

  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(500);
    }
    res.end('Server Error');
  });

  if (compression) {
    fileStream.pipe(compression.stream).pipe(res);
    return;
  }

  fileStream.pipe(res);
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
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (indexErr || !indexStats.isFile()) {
          res.writeHead(404);
          res.end('File not found');
        }
        sendFile(req, res, indexPath, 'text/html');
      });
      return;
    }

    // File exists - serve it
    sendFile(req, res, filePath, contentType);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${DIST_DIR}`);
});

