const Stream = require('node-rtsp-stream');

const stream = new Stream({
  name: 'camera-stream',
  streamUrl: 'rtsp://admin:APPIA-DADOOH@192.168.18.88:554/cam/realmonitor?channel=1&subtype=0',
  wsPort: 9999,
  ffmpegOptions: {
    '-stats': '',
    '-rtsp_transport': 'tcp'
  }
});
