// TESTE SIMPLES - APENAS LOGS
console.log('=== SCRIPT CARREGADO ===');

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
        
        // Se chegou até aqui, o face-api funciona
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
        // Criar canvas primeiro
        const videoCanvas = createVideoCanvas();
        console.log('Canvas criado:', videoCanvas);
        
        // Salvar referência global para debug
        window.debugCanvas = videoCanvas;
        
        const player = new JSMpeg.Player('ws://localhost:9999', {
            canvas: videoCanvas,
            audio: false,
            autoplay: true,
            onPlay: () => {
                console.log('=== VÍDEO TOCANDO ===');
                console.log('Canvas do player:', player.canvas);
                console.log('Canvas criado:', videoCanvas);
                console.log('Canvas é o mesmo?', player.canvas === videoCanvas);
                document.getElementById('status').textContent = '✅ Vídeo funcionando - Detecção ativa';
                
                // Usar o canvas que criamos
                startSimpleDetection(videoCanvas);
            },
            onError: (error) => {
                console.error('Erro no player:', error);
                document.getElementById('status').textContent = '❌ Erro no vídeo: ' + error;
            }
        });
        
        // Salvar referência global para debug
        window.debugPlayer = player;
        
    } catch (error) {
        console.error('Erro ao criar player:', error);
        document.getElementById('status').textContent = '❌ Erro ao criar player: ' + error.message;
    }
}

function createVideoCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    
    const videoContainer = document.getElementById('video-container');
    videoContainer.appendChild(canvas);
    
    console.log('Canvas criado:', canvas.width + 'x' + canvas.height);
    return canvas;
}

function startSimpleDetection(videoCanvas) {
    console.log('=== INICIANDO DETECÇÃO SIMPLES ===');
    console.log('Canvas recebido:', videoCanvas);
    console.log('Canvas válido?', videoCanvas instanceof HTMLCanvasElement);
    console.log('Canvas dimensões:', videoCanvas.width, 'x', videoCanvas.height);
    
    if (!videoCanvas || !(videoCanvas instanceof HTMLCanvasElement)) {
        console.error('❌ Canvas inválido para detecção!');
        return;
    }
    
    let detectionCount = 0;
    let successCount = 0;
    
    const detect = async () => {
        try {
            detectionCount++;
            
            if (detectionCount % 30 === 0) {
                console.log(`Detecção #${detectionCount} - Sucessos: ${successCount}`);
                console.log('Canvas ainda válido?', videoCanvas instanceof HTMLCanvasElement);
                console.log('Canvas dimensões:', videoCanvas.width, 'x', videoCanvas.height);
            }
            
            // Verificar se o canvas tem dados válidos
            const ctx = videoCanvas.getContext('2d');
            if (!ctx) {
                console.warn('Canvas context não disponível');
                setTimeout(detect, 200);
                return;
            }
            
            // Verificar se há dados de imagem no canvas
            let hasVideoData = false;
            try {
                const imageData = ctx.getImageData(0, 0, 10, 10);
                if (imageData && !imageData.data.every(val => val === 0)) {
                    hasVideoData = true;
                }
            } catch (e) {
                // Canvas ainda não está pronto para leitura
                if (detectionCount % 50 === 0) {
                    console.log('Canvas ainda não está pronto para leitura');
                }
                setTimeout(detect, 300);
                return;
            }
            
            if (!hasVideoData) {
                if (detectionCount % 50 === 0) {
                    console.log('Canvas não tem dados de vídeo ainda');
                }
                setTimeout(detect, 300);
                return;
            }
            
            // Tentar detecção
            const detections = await faceapi
                .detectAllFaces(videoCanvas, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,
                    scoreThreshold: 0.3
                }));
            
            successCount++;
            
            if (detections.length > 0) {
                console.log(`✓ DETECÇÃO #${detectionCount}: ${detections.length} face(s) encontrada(s)!`);
                
                // Desenhar retângulos diretamente no canvas do vídeo
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 3;
                ctx.fillStyle = '#00ff00';
                ctx.font = '16px Arial';
                
                detections.forEach((detection, index) => {
                    const { x, y, width, height } = detection.box;
                    console.log(`Face ${index + 1}: x=${Math.round(x)}, y=${Math.round(y)}, w=${Math.round(width)}, h=${Math.round(height)}`);
                    
                    // Desenhar retângulo
                    ctx.strokeRect(x, y, width, height);
                    
                    // Desenhar label
                    const label = `Face ${index + 1}`;
                    ctx.fillText(label, x, Math.max(y - 5, 15));
                });
                
                // Atualizar status
                document.getElementById('status').textContent = `✅ Vídeo ativo - ${detections.length} face(s) detectada(s)`;
            } else {
                if (detectionCount % 100 === 0) {
                    console.log(`Detecção #${detectionCount}: Nenhuma face encontrada`);
                    document.getElementById('status').textContent = '✅ Vídeo ativo - Procurando faces...';
                }
            }
            
        } catch (error) {
            console.error('❌ Erro na detecção #' + detectionCount + ':', error.message);
            // Se o canvas não é válido, aguardar mais tempo
            if (error.message.includes('toNetInput') || error.message.includes('Input')) {
                console.log('Canvas não está pronto para detecção, aguardando...');
            }
            document.getElementById('status').textContent = '⚠️ Erro na detecção: ' + error.message;
        }
        
        setTimeout(detect, 400); // Detectar a cada 400ms
    };
    
    // Aguardar 3 segundos antes de começar para garantir que o vídeo começou
    console.log('Aguardando 3 segundos para o vídeo estabilizar...');
    setTimeout(() => {
        console.log('🚀 Iniciando detecção facial...');
        detect();
    }, 3000);
}

console.log('=== SCRIPT FINALIZADO ===');
