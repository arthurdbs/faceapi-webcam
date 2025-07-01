const video = document.getElementById('video');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      console.error(err);
    });
}

video.addEventListener('play', async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(canvas);
    });
  }, 100);
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
