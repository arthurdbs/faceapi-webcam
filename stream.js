const Stream = require('node-rtsp-stream');

const stream = new Stream({
  name: 'camera-stream',
  // Insira a URL RTSP da sua câmera de segurança aqui
  streamUrl: 'rtsp://admin:APPIA-DADOOH@192.168.18.88:554/cam/realmonitor?channel=1&subtype=1', // Alterado para subtype=1 (sub stream)
  wsPort: 9999,
  ffmpegOptions: {
    '-stats': '',
    '-rtsp_transport': 'tcp', // Força o uso de TCP para maior confiabilidade
    '-fflags': 'nobuffer',    // Reduz a latência
    '-tune': 'zerolatency',    // Otimiza para baixa latência
    '-r': '24' // Força a taxa de quadros de saída para 24fps, compatível com MPEG-1
  }
});
