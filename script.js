
const url = 'ws://localhost:9999'; // URL para o stream WebSocket
const videoContainer = document.getElementById('video-container');

// TESTE: cria um canvas manualmente para ver se aparece
const testCanvas = document.createElement('canvas');
testCanvas.width = 320;
testCanvas.height = 240;
testCanvas.style.border = "2px solid red";
testCanvas.style.position = "absolute";
testCanvas.style.zIndex = 1000;
videoContainer.appendChild(testCanvas);

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

// Função para aguardar o canvas estar pronto
async function waitForCanvasReady(canvas, maxTries = 20, interval = 300) {
  let tries = 0;
  while (tries < maxTries) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context ainda não disponível, tentativa', tries + 1);
      await new Promise(res => setTimeout(res, interval));
      tries++;
      continue;
    }
    let pixels;
    try {
      pixels = ctx.getImageData(0, 0, 1, 1).data;
    } catch (e) {
      console.warn('Erro ao acessar getImageData, tentativa', tries + 1, e);
      await new Promise(res => setTimeout(res, interval));
      tries++;
      continue;
    }
    if (pixels[3] !== 0) return true; // Se o alpha não for 0, tem imagem
    await new Promise(res => setTimeout(res, interval));
    tries++;
  }
  return false;
}

// Inicia o player de vídeo e a detecção facial
async function startPlayerAndDetection() {
  console.log("Iniciando player de vídeo...");
  const player = new JSMpeg.Player(url, {
    audio: false,
    // Passa explicitamente o container para o JSMpeg criar o canvas dentro dele
    // Isso garante que o canvas será filho de videoContainer
    // https://github.com/phoboslab/jsmpeg#usage
    // O canvas será criado automaticamente dentro do container
    // Assim o MutationObserver funciona corretamente
    // O canvas será o primeiro filho do videoContainer
    // O overlay será adicionado depois
    // O resto do código permanece igual
    //
    // O onPlay é chamado quando o player começa a tocar
    // O observer detecta o canvas assim que ele aparece
    //
    // Adiciona a opção "container"
    //
    // O resto do código permanece igual
    container: videoContainer,
    onPlay: () => {
      console.log("Stream de vídeo iniciado. Aguardando canvas do player...");
      const observer = new MutationObserver(async (mutationsList, observerInstance) => {
        const videoCanvas = videoContainer.querySelector('canvas');
        if (videoCanvas) {
          observerInstance.disconnect();
          console.log('Canvas do player detectado. Iniciando detecção de rosto...');

          const labeledFaceDescriptors = (await loadLabeledImages()).filter(d => d !== null);
          if (labeledFaceDescriptors.length === 0) {
            console.error("Nenhum descritor de rosto foi carregado com sucesso. A detecção não pode continuar.");
            alert("Não foi possível carregar os dados de reconhecimento. Verifique o console.");
            return;
          }
          console.log("Descritores carregados e prontos.");

          // Aguarda o canvas ter imagem antes de criar o overlay
          const ready = await waitForCanvasReady(videoCanvas);
          if (!ready) {
            console.error("Canvas do vídeo não ficou pronto a tempo. Não será possível detectar rostos.");
            return;
          }

          const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
          const displaySize = { width: videoCanvas.width, height: videoCanvas.height };
          const overlay = faceapi.createCanvasFromMedia(videoCanvas);
          videoContainer.appendChild(overlay);
          faceapi.matchDimensions(overlay, displaySize);

          console.log("Iniciando loop de detecção...");
          setInterval(async () => {
            const ctx = videoCanvas.getContext('2d');
            if (!ctx) {
              console.warn('Contexto do canvas não disponível nesta iteração. Pulando detecção.');
              return;
            }
            let detections = [];
            try {
              detections = await faceapi.detectAllFaces(videoCanvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
            } catch (e) {
              console.warn('Erro ao rodar detectAllFaces:', e);
              return;
            }
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const overlayCtx = overlay.getContext('2d');
            if (!overlayCtx) {
              console.warn('Contexto do overlay não disponível.');
              return;
            }
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

            // Log de debug: quantos rostos detectados
            console.log(`Rostos detectados: ${resizedDetections.length}`);

            const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
            results.forEach((result, i) => {
              const box = resizedDetections[i].detection.box;
              const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
              drawBox.draw(overlay);
            });
          }, 2000);
        }
      });
      observer.observe(videoContainer, { childList: true, subtree: true });
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
