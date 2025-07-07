
const Stream = require('node-rtsp-stream');

const stream = new Stream({
  name: 'camera-stream',
  streamUrl: 'rtsp://admin:APPIA-DADOOH@192.168.18.187:554/cam/realmonitor?channel=1&subtype=1',
  wsPort: 9999,
  ffmpegOptions: {
    '-stats': '',
    '-rtsp_transport': 'tcp',
    '-max_delay': '5000000',
    '-r': '24'
  }
});

// Log para cada nova conexão WebSocket
if (stream.wsServer) {
  stream.wsServer.on('connection', function () {
    console.log('camera-stream: New WebSocket Connection');
  });
} else {
  console.warn('stream.wsServer não está disponível para log de conexão WebSocket.');
}
