import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_DIR = path.join(__dirname, '../workspace');

export function setupWebSocket(wss) {
  const clients = new Set();

  // File watcher
  const watcher = chokidar.watch(WORKSPACE_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
  });

  watcher
    .on('add', (filePath) => broadcast({ type: 'file:added', path: path.relative(WORKSPACE_DIR, filePath) }))
    .on('change', (filePath) => broadcast({ type: 'file:changed', path: path.relative(WORKSPACE_DIR, filePath) }))
    .on('unlink', (filePath) => broadcast({ type: 'file:deleted', path: path.relative(WORKSPACE_DIR, filePath) }));

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          
          case 'subscribe':
            ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
            break;
          
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send initial connection success
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'WebSocket connection established',
      timestamp: Date.now()
    }));
  });

  function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  }

  return { watcher, broadcast };
}
