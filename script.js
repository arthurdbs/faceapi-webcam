// Configurações
const WEBSOCKET_URL = 'ws://localhost:9999';
const MODEL_PATH = '/models';

// Elementos DOM
const videoContainer = document.getElementById('video-container');
const statusElement = document.getElementById('status');

// Variáveis globais
let player = null;
let isDetectionRunning = false;

// Função para atualizar status na tela
function updateStatus(message, type = 'loading') {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Função principal
async function main() {
    try {
        // Verificar se face-api.js está disponível
        if (typeof faceapi === 'undefined') {
            throw new Error('face-api.js não foi carregado. Verifique a conexão com a internet.');
        }
        
        updateStatus('Carregando modelos de detecção facial...', 'loading');
        
        // Carregar apenas modelos essenciais que existem
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH + '/tiny_face_detector'),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH)
        ]);
        
        updateStatus('Modelos carregados! Iniciando transmissão de vídeo...', 'loading');
        
        // Iniciar player de vídeo
        startVideoPlayer();
        
    } catch (error) {
        console.error('Erro ao carregar modelos:', error);
        updateStatus('Erro ao carregar modelos: ' + error.message, 'error');
    }
}

// Iniciar player JSMpeg
function startVideoPlayer() {
    try {
        // Verificar se JSMpeg está disponível
        if (typeof JSMpeg === 'undefined') {
            throw new Error('JSMpeg não foi carregado. Verifique se o arquivo jsmpeg.min.js foi carregado corretamente.');
        }
        
        updateStatus('Conectando ao stream de vídeo...', 'loading');
        
        player = new JSMpeg.Player(WEBSOCKET_URL, {
            canvas: createVideoCanvas(),
            audio: false,
            autoplay: true,
            loop: false,
            onConnect: () => {
                updateStatus('Conectado! Aguardando dados de vídeo...', 'loading');
                console.log('WebSocket conectado com sucesso');
            },
            onPlay: () => {
                updateStatus('✅ Transmissão ativa - Detecção facial funcionando', 'connected');
                console.log('Player iniciado, começando detecção facial');
                startFaceDetection();
            },
            onStall: () => {
                updateStatus('⚠️ Buffer de vídeo - Reconectando...', 'loading');
                console.log('Stream pausado ou com buffer');
            },
            onEnded: () => {
                updateStatus('❌ Transmissão interrompida', 'error');
                console.log('Stream terminado');
            },
            onError: (error) => {
                updateStatus('❌ Erro na transmissão: ' + error, 'error');
                console.error('Erro no player:', error);
            }
        });
        
    } catch (error) {
        console.error('Erro ao iniciar player:', error);
        updateStatus('Erro ao conectar com o stream: ' + error.message, 'error');
    }
}

// Criar canvas para o vídeo
function createVideoCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.id = 'video-canvas';
    videoContainer.appendChild(canvas);
    console.log('Canvas de vídeo criado:', canvas.width + 'x' + canvas.height);
    return canvas;
}

// Iniciar detecção facial
function startFaceDetection() {
    if (isDetectionRunning || !player || !player.canvas) {
        console.log('Detecção já está rodando ou player não disponível');
        return;
    }
    
    isDetectionRunning = true;
    const canvas = player.canvas;
    
    console.log('Iniciando detecção facial no canvas:', canvas.width + 'x' + canvas.height);
    
    // Criar overlay para desenhar detecções
    const overlay = document.createElement('canvas');
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.pointerEvents = 'none';
    overlay.id = 'face-overlay';
    
    // Posicionar overlay sobre o vídeo
    videoContainer.style.position = 'relative';
    videoContainer.appendChild(overlay);
    
    console.log('Overlay criado e posicionado');
    
    // Loop de detecção
    detectFaces(canvas, overlay);
}

// Função de detecção facial
async function detectFaces(videoCanvas, overlay) {
    const overlayCtx = overlay.getContext('2d');
    let detectionCount = 0;
    
    const detect = async () => {
        try {
            // Verificar se o canvas tem dados de vídeo
            const ctx = videoCanvas.getContext('2d');
            if (!ctx) {
                console.warn('Canvas context não disponível');
                return;
            }
            
            // Detectar faces com configurações mais permissivas
            const detections = await faceapi
                .detectAllFaces(videoCanvas, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,
                    scoreThreshold: 0.3  // Limite mais baixo para detectar melhor
                }))
                .withFaceLandmarks()
                .withFaceExpressions();
            
            // Limpar overlay
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
            
            // Log periódico para debug
            detectionCount++;
            if (detectionCount % 30 === 0) {  // A cada 30 detecções (aprox. 3 segundos)
                console.log(`Detecção #${detectionCount} - Faces encontradas: ${detections.length}`);
            }
            
            // Desenhar detecções
            if (detections.length > 0) {
                console.log(`✓ ${detections.length} face(s) detectada(s)`);
                
                // Redimensionar detecções para o tamanho do canvas
                const resizedDetections = faceapi.resizeResults(detections, {
                    width: videoCanvas.width,
                    height: videoCanvas.height
                });
                
                // Desenhar caixas e informações
                resizedDetections.forEach((detection, index) => {
                    const { box } = detection.detection;
                    const { expressions } = detection;
                    
                    // Encontrar expressão dominante
                    const dominantExpression = Object.keys(expressions).reduce((a, b) => 
                        expressions[a] > expressions[b] ? a : b
                    );
                    
                    // Desenhar caixa
                    overlayCtx.strokeStyle = '#00ff00';
                    overlayCtx.lineWidth = 2;
                    overlayCtx.strokeRect(box.x, box.y, box.width, box.height);
                    
                    // Desenhar label com expressão
                    const confidence = (expressions[dominantExpression] * 100).toFixed(1);
                    const label = `Face ${index + 1}: ${dominantExpression} (${confidence}%)`;
                    
                    // Fundo do texto
                    overlayCtx.fillStyle = '#00ff00';
                    const textWidth = overlayCtx.measureText(label).width;
                    overlayCtx.fillRect(box.x, box.y - 25, textWidth + 10, 20);
                    
                    // Texto
                    overlayCtx.fillStyle = '#000000';
                    overlayCtx.font = '14px Arial';
                    overlayCtx.fillText(label, box.x + 5, box.y - 10);
                });
            }
            
        } catch (error) {
            console.warn('Erro na detecção facial:', error.message);
        }
        
        // Continuar detecção
        if (isDetectionRunning) {
            setTimeout(detect, 100); // Detectar a cada 100ms
        }
    };
    
    console.log('Iniciando loop de detecção...');
    detect();
}

// Iniciar aplicação quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, iniciando aplicação...');
    main();
});
