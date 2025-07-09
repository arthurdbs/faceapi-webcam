// VERSÃO COM OVERLAY SEPARADO
console.log('=== SCRIPT OVERLAY CARREGADO ===');

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM CARREGADO ===');
    
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = 'Script funcionando!';
        statusElement.className = 'status connected';
    }
    
    console.log('=== TESTANDO JSMPEG ===');
    console.log('JSMpeg disponível:', typeof JSMpeg !== 'undefined');
    
    console.log('=== TESTANDO FACE-API ===');
    setTimeout(() => {
        console.log('face-api disponível após timeout:', typeof faceapi !== 'undefined');
        
        if (typeof faceapi !== 'undefined') {
            console.log('face-api está disponível! Tentando carregar modelos...');
            testFaceAPI();
        } else {
            console.error('face-api NÃO está disponível!');
        }
    }, 3000);
});

async function testFaceAPI() {
    try {
        console.log('=== TESTANDO CARREGAMENTO DE MODELO ===');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector');
        console.log('✓ TinyFaceDetector carregado com sucesso!');
        
        initializeVideo();
        
    } catch (error) {
        console.error('Erro ao carregar modelo:', error);
    }
}

function initializeVideo() {
    console.log('=== INICIALIZANDO VÍDEO ===');
    
    const videoContainer = document.getElementById('video-container');
    if (!videoContainer) {
        console.error('Container de vídeo não encontrado!');
        return;
    }
    
    console.log('Container encontrado, criando player...');
    
    try {
        const player = new JSMpeg.Player('ws://localhost:9999', {
            canvas: createVideoCanvas(),
            audio: false,
            autoplay: true,
            onPlay: () => {
                console.log('=== VÍDEO TOCANDO ===');
                document.getElementById('status').textContent = '✅ Vídeo funcionando - Detecção ativa';
                startOverlayDetection(player.canvas);
            },
            onError: (error) => {
                console.error('Erro no player:', error);
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar player:', error);
    }
}

function createVideoCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.id = 'video-canvas';
    
    const videoContainer = document.getElementById('video-container');
    videoContainer.appendChild(canvas);
    
    console.log('Canvas criado:', canvas.width + 'x' + canvas.height);
    return canvas;
}

function startOverlayDetection(videoCanvas) {
    console.log('=== INICIANDO DETECÇÃO COM OVERLAY ===');
    
    // Criar overlay separado para desenhar as detecções
    const overlay = document.createElement('canvas');
    overlay.width = videoCanvas.width;
    overlay.height = videoCanvas.height;
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10';
    overlay.id = 'face-overlay';
    
    // Posicionar overlay sobre o vídeo
    const videoContainer = document.getElementById('video-container');
    videoContainer.style.position = 'relative';
    videoContainer.appendChild(overlay);
    
    console.log('Overlay criado e posicionado');
    
    let detectionCount = 0;
    const overlayCtx = overlay.getContext('2d');
    
    const detect = async () => {
        try {
            detectionCount++;
            
            if (detectionCount % 50 === 0) {
                console.log(`Detecção #${detectionCount} - Testando...`);
            }
            
            // Limpar overlay anterior
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
            
            // Verificar se o canvas do vídeo tem dados
            const videoCtx = videoCanvas.getContext('2d');
            if (!videoCtx) {
                setTimeout(detect, 300);
                return;
            }
            
            // Verificar se há dados de imagem
            try {
                const imageData = videoCtx.getImageData(0, 0, 10, 10);
                if (!imageData || imageData.data.every(val => val === 0)) {
                    setTimeout(detect, 300);
                    return;
                }
            } catch (e) {
                setTimeout(detect, 300);
                return;
            }
            
            // Fazer detecção
            const detections = await faceapi
                .detectAllFaces(videoCanvas, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,
                    scoreThreshold: 0.3
                }));
            
            if (detections.length > 0) {
                console.log(`✓ ${detections.length} face(s) detectada(s)!`);
                
                // Desenhar no overlay (não no canvas do vídeo)
                overlayCtx.strokeStyle = '#00ff00';
                overlayCtx.lineWidth = 3;
                overlayCtx.fillStyle = '#00ff00';
                overlayCtx.font = '16px Arial';
                
                detections.forEach((detection, index) => {
                    const { x, y, width, height } = detection.box;
                    
                    // Desenhar retângulo
                    overlayCtx.strokeRect(x, y, width, height);
                    
                    // Desenhar label
                    const label = `Face ${index + 1}`;
                    overlayCtx.fillText(label, x, y - 10);
                });
            }
            
        } catch (error) {
            console.error('Erro na detecção:', error.message);
            if (error.message.includes('toNetInput')) {
                console.log('Canvas não está pronto, aguardando...');
            }
        }
        
        setTimeout(detect, 500); // Detectar a cada 500ms
    };
    
    // Aguardar 3 segundos para o vídeo estabilizar
    console.log('Aguardando 3 segundos para o vídeo estabilizar...');
    setTimeout(() => {
        console.log('Iniciando detecção com overlay...');
        detect();
    }, 3000);
}

console.log('=== SCRIPT OVERLAY FINALIZADO ===');
