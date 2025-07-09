const express = require('express');
const Stream = require('node-rtsp-stream');
const path = require('path');

const app = express();
const port = 3000;

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Configurar stream da câmera iME 360 C
const stream = new Stream({
  name: 'camera-stream',
  streamUrl: 'rtsp://admin:APPIA-DADOOH@192.168.1.24:554/cam/realmonitor?channel=1&subtype=1',
  wsPort: 9999,
  ffmpegOptions: {
    '-stats': '',
    '-rtsp_transport': 'tcp',
    '-max_delay': '5000000',
    '-r': '25', // 25 fps (suportado pelo MPEG-1)
    '-s': '640x480', // Resolução fixa
    '-f': 'mpegts',
    '-codec:v': 'mpeg1video',
    '-b:v': '1000k',
    '-maxrate': '1000k',
    '-bufsize': '1000k'
  }
});

// Log de conexões WebSocket
if (stream.wsServer) {
  stream.wsServer.on('connection', function () {
    console.log('Nova conexão WebSocket estabelecida');
  });
}

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log('Stream WebSocket disponível em ws://localhost:9999');
});
