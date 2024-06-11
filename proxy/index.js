const http = require('http');
const httpProxy = require('http-proxy');
const WebSocket = require('ws');

// Create HTTP proxy
const httpProxyServer = httpProxy.createProxyServer({});

// Create WebSocket proxy
const wsProxyServer = new WebSocket.Server({ noServer: true });

// Handle HTTP requests
const httpServer = http.createServer((req, res) => {
    // Extract the target URL from the request headers or query parameters
    const target = req.headers['x-target-url'] || req.url|| req.originalUrl;
    console.log(target)
    if (!target) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request: target URL is required');
        return;
    }

    // Proxy HTTP request to the target
    httpProxyServer.web(req, res, { target }, (error) => {
        console.error('Error proxying HTTP request:', error);
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Gateway');
    });
});

// Handle WebSocket upgrade requests
httpServer.on('upgrade', (req, socket, head) => {
    // Extract the target URL from the request headers or query parameters
    const target = req.headers['x-target-url'] || req.url || req.originalUrl;

    if (!target) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
    }

    // Proxy WebSocket request to the target
    wsProxyServer.handleUpgrade(req, socket, head, (ws) => {
        const wsTarget = new WebSocket(target);
        wsTarget.on('open', () => {
            ws.on('message', (message) => {
                wsTarget.send(message);
            });
            wsTarget.on('message', (message) => {
                ws.send(message);
            });
        });
        wsTarget.on('close', () => {
            ws.close();
        });
    });
});

// Start the proxy server
const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Proxy server listening on port ${PORT}`);
});