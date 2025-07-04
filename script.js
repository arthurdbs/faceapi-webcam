const canvas = document.getElementById('canvas');
const url = 'ws://localhost:9999'; // URL para o stream WebSocket

// Função principal assíncrona para encapsular a lógica
async function main() {
  console.log("Carregando modelos do FaceAPI...");
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector'), // Caminho corrigido
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    console.log("Modelos carregados com sucesso.");
    startPlayerAndDetection();
  } catch (error) {
    console.error("Erro ao carregar modelos do FaceAPI:", error);
    alert("Não foi possível carregar os modelos de reconhecimento facial. Verifique o console para mais detalhes.");
  }
}

// Carrega os descritores do servidor
async function loadLabeledImages() {
  const labels = ['Arthur']; // O nome/rótulo que você salvou no banco de dados
  console.log("Carregando descritores de rosto para:", labels.join(', '));

  return Promise.all(
    labels.map(async label => {
      try {
        const response = await fetch(`http://localhost:3000/descriptors/${label}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Falha ao buscar descritor para ${label}: ${errorData.error || response.statusText}`);
        }
        const descriptors = await response.json();
        if (!descriptors || descriptors.length === 0) {
          throw new Error(`Nenhum descritor válido retornado para ${label}`);
        }

        // O servidor já formata o descritor, então apenas o convertemos para Float32Array
        const faceDescriptors = descriptors.map(d => new Float32Array(d));
        return new faceapi.LabeledFaceDescriptors(label, faceDescriptors);

      } catch (error) {
        console.error(`Erro ao carregar descritores para o rótulo \"${label}\":`, error);
        // Retorna null se um rótulo específico falhar
        return null;
      }
    })
  );
}

// Inicia o player de vídeo e a detecção facial
async function startPlayerAndDetection() {
  console.log("Iniciando player de vídeo...");
  const player = new JSMpeg.Player(url, {
    canvas: canvas,
    audio: false,
    onPlay: async () => {
      console.log("Stream de vídeo iniciado. Configurando detecção de rosto...");

      const labeledFaceDescriptors = (await loadLabeledImages()).filter(d => d !== null);
      if (labeledFaceDescriptors.length === 0) {
        console.error("Nenhum descritor de rosto foi carregado com sucesso. A detecção não pode continuar.");
        alert("Não foi possível carregar os dados de reconhecimento. Verifique o console.");
        return;
      }
      console.log("Descritores carregados e prontos.");

      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
      const displaySize = { width: canvas.width, height: canvas.height };
      const overlay = faceapi.createCanvasFromMedia(canvas);
      document.querySelector('div[style*="position: relative"]').append(overlay);
      faceapi.matchDimensions(overlay, displaySize);

      console.log("Iniciando loop de detecção...");
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
      }, 2000); // Aumentado para 2 segundos para dar mais tempo de processamento
    },
    onStall: () => {
        console.warn("Stream de vídeo pausado ou com buffer.");
    },
    onEnded: () => {
        console.error("Stream de vídeo terminado.");
    }
  });
}

// Inicia a aplicação
main();
