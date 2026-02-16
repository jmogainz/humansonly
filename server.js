const { createServer: createHttpServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const { parse } = require('url');
const { existsSync, readFileSync } = require('fs');
const { resolve } = require('path');
const next = require('next');

const args = process.argv.slice(2);
let hostname = process.env.HOSTNAME || '127.0.0.1';
let port = parseInt(process.env.PORT, 10) || 8080;
let useHttps = false;
let certFile = process.env.SSL_CERT || 'cert.pem';
let keyFile = process.env.SSL_KEY || 'key.pem';

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--hostname' || args[i] === '-H') {
    hostname = args[i + 1];
    i += 1;
  } else if (args[i] === '--port' || args[i] === '-p') {
    port = parseInt(args[i + 1], 10);
    i += 1;
  } else if (args[i] === '--https' || args[i] === '-s') {
    useHttps = true;
  } else if (args[i] === '--cert') {
    certFile = args[i + 1];
    i += 1;
  } else if (args[i] === '--key') {
    keyFile = args[i + 1];
    i += 1;
  }
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function requestHandler(req, res) {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  const parsedUrl = parse(req.url, true);
  handle(req, res, parsedUrl);
}

app.prepare().then(() => {
  let server;
  let protocol = 'http';

  if (useHttps) {
    const certPath = resolve(process.cwd(), certFile);
    const keyPath = resolve(process.cwd(), keyFile);

    if (!existsSync(certPath) || !existsSync(keyPath)) {
      console.error('HTTPS certificate/key not found.');
      console.error(`Expected cert: ${certPath}`);
      console.error(`Expected key:  ${keyPath}`);
      process.exit(1);
    }

    server = createHttpsServer(
      {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
      },
      requestHandler
    );
    protocol = 'https';
  } else {
    server = createHttpServer(requestHandler);
  }

  const listenArgs = hostname ? [port, hostname] : [port];
  server.listen(...listenArgs, (err) => {
    if (err) throw err;
    const host = hostname || 'localhost';
    console.log(`HumansOnly ready on ${protocol}://${host}:${port}`);
  });
});
