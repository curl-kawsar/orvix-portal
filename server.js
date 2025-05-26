const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0'; // Use 0.0.0.0 to listen on all interfaces
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname: 'localhost', port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Handle AWS load balancer health checks
      if (req.url === '/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('OK');
        return;
      }

      // Log request information for debugging
      console.log(`Request: ${req.method} ${req.url}`);
      console.log(`Headers: ${JSON.stringify(req.headers)}`);

      // Fix the host header if it's the EC2 internal IP
      const host = req.headers.host || '';
      if (host.includes('172.') || host.includes('localhost')) {
        // Replace internal IP with the public DNS or IP if available
        const publicDomain = process.env.PUBLIC_DOMAIN;
        if (publicDomain) {
          req.headers.host = publicDomain;
        }
      }

      // Handle HTTP to HTTPS redirects
      const forwardedProto = req.headers['x-forwarded-proto'];
      if (!dev && forwardedProto === 'http' && process.env.FORCE_HTTPS === 'true') {
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        res.writeHead(301, { Location: httpsUrl });
        res.end();
        return;
      }

      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 