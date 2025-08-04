const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

app.use(express.static('public'));

const server = app.listen(port, () => console.log(`Server running on port ${port}`));
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  const outputDir = path.join(__dirname, 'public/hls');
  fs.mkdirSync(outputDir, { recursive: true });

  const ffmpeg = spawn('ffmpeg', [
    '-i', 'pipe:0',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-g', '50',
    '-sc_threshold', '0',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '5',
    '-hls_flags', 'delete_segments',
    path.join(outputDir, 'stream.m3u8'),
  ]);

  ws.on('message', function incoming(data) {
    ffmpeg.stdin.write(data);
  });

  ws.on('close', () => {
    ffmpeg.kill('SIGINT');
  });
});
