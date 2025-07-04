const canvas = document.getElementById('canvas');
const url = 'ws://localhost:9999';

// Função para iniciar a detecção facial
async function startFaceDetection() {
  console.log("Iniciando detecção de rostos...");
  const displaySize = { width: canvas.width, height: canvas.height };
  const overlay = faceapi.createCanvasFromMedia(canvas);
  document.querySelector('div[style*="position: relative"]').append(overlay);
  faceapi.matchDimensions(overlay, displaySize);

  const labeledFaceDescriptors = await loadLabeledImages();
  if (!labeledFaceDescriptors) {
    console.error("Nenhum descritor de rosto carregado.");
    return;
  }
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);

    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(overlay);
    });
  }, 2000);
}

// Carrega os modelos e depois inicia o player
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(() => {
  console.log("Modelos do FaceAPI carregados.");
  // Inicia o player de vídeo
  const player = new JSMpeg.Player(url, {
    canvas: canvas,
    audio: false, // Desativa o áudio
    onPlay: () => {
      console.log("Stream de vídeo iniciado.");
      startFaceDetection(); // Inicia a detecção DEPOIS que o vídeo começar a tocar
    }
  });
});

async function loadLabeledImages() {
  const labels = ['Arthur']; // Alterado para um novo nome de exemplo
  return Promise.all(
    labels.map(async label => {
      try {
        const response = await fetch(`http://localhost:3000/descriptors/${label}`);
        if (!response.ok) {
          throw new Error(`Não foi possível buscar os descritores para ${label}: ${response.statusText}`);
        }
        const descriptors = await response.json();

        if (!descriptors || descriptors.length === 0) {
          throw new Error(`Nenhum descritor encontrado para o rótulo: ${label}`);
        }

        // Garante que todos os descritores tenham 128 floats
        const faceDescriptors = descriptors
          .map(d => Array.isArray(d) && d.length === 128 ? new Float32Array(d) : null)
          .filter(d => d);
        if (faceDescriptors.length === 0) {
          throw new Error(`Descritor inválido para o rótulo: ${label}`);
        }
        return new faceapi.LabeledFaceDescriptors(label, faceDescriptors);
      } catch (error) {
        console.error("Erro ao carregar imagens rotuladas:", error);
        // Retorna um objeto vazio em caso de erro para não quebrar o Promise.all
        return new faceapi.LabeledFaceDescriptors(label, []);
      }
    })
  );
}
