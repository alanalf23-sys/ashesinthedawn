#!/usr/bin/env node
// Node bridge that forwards commands to Python AudioEngine when available.
// Falls back to in-memory store if Python bridge not available.

const http = require('http');
const url = require('url');
const { spawn } = require('child_process');

const PORT = process.env.ENGINE_BRIDGE_PORT || 41234;
let pythonProc = null;
let pythonAvailable = false;
let pending = [];

// Try to spawn a local Python engine bridge script if present
try {
  // Expect a script at daw_core/engine_bridge.py that accepts JSON-RPC on stdin/stdout
  pythonProc = spawn(process.execPath.replace(/node.exe$/, 'python'), ['-u', 'daw_core/engine_bridge.py']);

  pythonProc.stdout.setEncoding('utf8');
  pythonProc.stderr.setEncoding('utf8');

  pythonProc.stdout.on('data', (data) => {
    // Attempt to parse line-delimited JSON responses
    data.split('\n').forEach((line) => {
      if (!line) return;
      try {
        const msg = JSON.parse(line);
        // If there is a pending resolver, resolve it
        const resolver = pending.shift();
        if (resolver) resolver.resolve(msg);
      } catch (e) {
        console.warn('PYTHON ->', line);
      }
    });
  });

  pythonProc.stderr.on('data', (chunk) => {
    console.error('PY ERR>', chunk);
  });

  pythonProc.on('exit', (code) => {
    console.warn('Python engine bridge exited', code);
    pythonAvailable = false;
  });

  // If spawned successfully, mark available
  pythonAvailable = true;
} catch (e) {
  console.warn('Python engine bridge not available, using fallback store', e);
  pythonAvailable = false;
}

// Fallback in-memory store
const tracks = new Map();

function sendToPython(method, params) {
  return new Promise((resolve, reject) => {
    if (!pythonAvailable || !pythonProc) return reject(new Error('python-not-available'));
    const id = Date.now() + Math.random();
    const payload = JSON.stringify({ id, method, params });
    pending.push({ id, resolve, reject });
    // Write JSON line
    pythonProc.stdin.write(payload + '\n');
    // Timeout
    setTimeout(() => {
      // If still pending, reject
      const idx = pending.findIndex(p => p.id === id);
      if (idx !== -1) {
        pending[idx].reject(new Error('timeout'));
        pending.splice(idx, 1);
      }
    }, 3000);
  });
}

function setTrackVolume(trackId, volumeDb) {
  if (pythonAvailable) {
    return sendToPython('setTrackVolume', { trackId, volumeDb });
  }
  const t = tracks.get(trackId) || {};
  t.volume = volumeDb;
  tracks.set(trackId, t);
  return Promise.resolve({ success: true, trackId, volume: volumeDb });
}

function setTrackMute(trackId, muted) {
  if (pythonAvailable) {
    return sendToPython('setTrackMute', { trackId, muted });
  }
  const t = tracks.get(trackId) || {};
  t.muted = !!muted;
  tracks.set(trackId, t);
  return Promise.resolve({ success: true, trackId, muted: !!muted });
}

function setTrackSolo(trackId, solo) {
  if (pythonAvailable) {
    return sendToPython('setTrackSolo', { trackId, solo });
  }
  const t = tracks.get(trackId) || {};
  t.solo = !!solo;
  tracks.set(trackId, t);
  return Promise.resolve({ success: true, trackId, solo: !!solo });
}

function getTrack(trackId) {
  if (pythonAvailable) {
    return sendToPython('getTrack', { trackId });
  }
  return Promise.resolve(tracks.get(trackId) || null);
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

  if (req.method === 'POST' && parsed.pathname === '/rpc') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { method, params } = payload;
        let result = null;
        switch (method) {
          case 'setTrackVolume':
            result = await setTrackVolume(params.trackId, params.volumeDb);
            break;
          case 'setTrackMute':
            result = await setTrackMute(params.trackId, params.muted);
            break;
          case 'setTrackSolo':
            result = await setTrackSolo(params.trackId, params.solo);
            break;
          case 'getTrack':
            result = await getTrack(params.trackId);
            break;
          default:
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'method_not_found' }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', pythonAvailable }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, () => {
  console.log(`Engine bridge listening on http://localhost:${PORT} pythonAvailable=${pythonAvailable}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down engine bridge');
  server.close(() => process.exit(0));
  if (pythonProc) pythonProc.kill();
});
