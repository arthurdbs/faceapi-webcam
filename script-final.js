// SCRIPT FINAL - DETECÇÃO FACIAL OTIMIZADA
console.log('🚀 === SISTEMA DE DETECÇÃO FACIAL V2.0 ===');

let systemState = {
    faceApiLoaded: false,
    jsmpegLoaded: false,
    modelsLoaded: false,
    videoConnected: false,
    detectionActive: false,
    player: null,
    canvas: null,
    overlay: null,
    stats: {
        detections: 0,
        faces: 0,
        errors: 0,
        fps: 0
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 DOM carregado - Iniciando sistema...');
    updateStatus('🔄 Inicializando sistema...', 'warning');
    
    // Verificar bibliotecas
    checkLibraries();
    
    // Aguardar carregamento do face-api se necessário
    await waitForFaceAPI();
    
    // Carregar modelos
    await loadModels();
    
    // Inicializar vídeo
    initializeVideo();
});

function checkLibraries() {
    console.log('🔍 Verificando bibliotecas...');
    
    systemState.jsmpegLoaded = typeof JSMpeg !== 'undefined';
    systemState.faceApiLoaded = typeof faceapi !== 'undefined';
    
    console.log('JSMpeg:', systemState.jsmpegLoaded ? '✅' : '❌');
    console.log('Face-API:', systemState.faceApiLoaded ? '✅' : '❌');
    
    if (!systemState.jsmpegLoaded) {
        updateStatus('❌ JSMpeg não encontrado!', 'error');
        return false;
    }
    
    return true;
}

async function waitForFaceAPI() {
    if (systemState.faceApiLoaded) return true;
    
    console.log('⏳ Aguardando face-api.js...');
    updateStatus('⏳ Carregando face-api.js...', 'warning');
    
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos
    
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            attempts++;
            systemState.faceApiLoaded = typeof faceapi !== 'undefined';
            
            if (systemState.faceApiLoaded) {
                console.log('✅ Face-API carregado!');
                clearInterval(checkInterval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                console.error('❌ Timeout aguardando face-api.js');
                updateStatus('❌ Face-API não carregou', 'error');
                clearInterval(checkInterval);
                resolve(false);
            }
        }, 1000);
    });
}

async function loadModels() {
    if (!systemState.faceApiLoaded) return false;
    
    try {
        console.log('📦 Carregando modelos de IA...');
        updateStatus('📦 Carregando modelos...', 'warning');
        
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector');
        
        systemState.modelsLoaded = true;
        console.log('✅ Modelos carregados com sucesso!');
        updateStatus('✅ Modelos carregados', 'ok');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao carregar modelos:', error);
        updateStatus('❌ Erro nos modelos: ' + error.message, 'error');
        return false;
    }
}

function initializeVideo() {
    if (!systemState.modelsLoaded) {
        console.error('❌ Modelos não carregados, abortando...');
        return;
    }
    
    console.log('🎥 Inicializando player de vídeo...');
    updateStatus('🎥 Conectando câmera...', 'warning');
    
    const videoContainer = document.getElementById('video-container');
    if (!videoContainer) {
        console.error('❌ Container de vídeo não encontrado!');
        updateStatus('❌ Container não encontrado', 'error');
        return;
    }
    
    // Criar canvas principal para vídeo
    systemState.canvas = createVideoCanvas();
    
    // Criar overlay para detecções
    systemState.overlay = createOverlay();
    
    // Criar player JSMpeg
    try {
        systemState.player = new JSMpeg.Player('ws://localhost:9999', {
            canvas: systemState.canvas,
            audio: false,
            autoplay: true,
            onPlay: onVideoStart,
            onError: onVideoError
        });
        
        console.log('✅ Player criado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao criar player:', error);
        updateStatus('❌ Erro no player: ' + error.message, 'error');
    }
}

function createVideoCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.style.border = '2px solid #333';
    canvas.style.borderRadius = '8px';
    canvas.id = 'video-canvas';
    
    const container = document.getElementById('video-container');
    container.style.position = 'relative';
    container.appendChild(canvas);
    
    console.log('🎯 Canvas de vídeo criado:', canvas.width + 'x' + canvas.height);
    return canvas;
}

function createOverlay() {
    const overlay = document.createElement('canvas');
    overlay.width = 640;
    overlay.height = 480;
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '999';
    overlay.id = 'detection-overlay';
    
    const container = document.getElementById('video-container');
    container.style.position = 'relative';
    container.appendChild(overlay);
    
    console.log('🎯 Overlay AZUL criado e posicionado');
    
    // Teste visual para garantir que o overlay está funcionando
    setTimeout(() => {
        const ctx = overlay.getContext('2d');
        ctx.strokeStyle = '#FF0000'; // Vermelho para teste
        ctx.lineWidth = 5;
        ctx.strokeRect(10, 10, 100, 100);
        console.log('🔴 Quadrado de TESTE vermelho desenhado');
        
        setTimeout(() => {
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            console.log('🧹 Teste removido - overlay pronto para detecções AZUIS');
        }, 3000);
    }, 2000);
    
    return overlay;
}

function onVideoStart() {
    console.log('🎬 Vídeo iniciado com sucesso!');
    systemState.videoConnected = true;
    updateStatus('✅ Vídeo conectado - Iniciando detecção...', 'ok');
    
    // Aguardar um pouco antes de iniciar detecção E verificar se há dados
    setTimeout(() => {
        console.log('🔍 Verificando se o canvas tem dados de vídeo...');
        
        // Testar se realmente há dados no canvas
        const ctx = systemState.canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, 10, 10);
        const hasData = !imageData.data.every(val => val === 0);
        
        console.log('📊 Canvas tem dados:', hasData);
        
        if (hasData) {
            console.log('✅ Canvas pronto! Iniciando detecção facial...');
            startDetection();
        } else {
            console.log('⏳ Canvas ainda sem dados, aguardando mais...');
            setTimeout(() => {
                console.log('🔄 Tentando iniciar detecção novamente...');
                startDetection();
            }, 2000);
        }
    }, 3000);
}

function onVideoError(error) {
    console.error('❌ Erro no vídeo:', error);
    systemState.videoConnected = false;
    updateStatus('❌ Erro na conexão: ' + error, 'error');
}

function startDetection() {
    if (!systemState.videoConnected || !systemState.modelsLoaded) {
        console.warn('⚠️ Sistema não pronto para detecção');
        return;
    }
    
    console.log('🔍 Iniciando detecção facial...');
    systemState.detectionActive = true;
    updateStatus('🔍 Detecção ativa', 'ok');
    
    detectFaces();
}

async function detectFaces() {
    if (!systemState.detectionActive) {
        console.log('⚠️ Detecção não está ativa');
        return;
    }
    
    try {
        systemState.stats.detections++;
        
        // Verificar se o canvas tem dados
        if (!hasVideoData()) {
            if (systemState.stats.detections % 100 === 0) {
                console.log('⏳ Aguardando dados do vídeo... (frame', systemState.stats.detections, ')');
            }
            setTimeout(detectFaces, 100);
            return;
        }
        
        // Log ocasional de que estamos processando
        if (systemState.stats.detections % 200 === 0) {
            console.log('🔍 Processando detecção facial... frame', systemState.stats.detections);
        }
        
        // Fazer detecção com threshold mais baixo para pegar mais faces
        const detections = await faceapi
            .detectAllFaces(systemState.canvas, new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.1  // Threshold mais baixo para detectar mais facilmente
            }));
        
        systemState.stats.faces = detections.length;
        
        // SEMPRE limpar overlay antes de desenhar
        const overlayCtx = systemState.overlay.getContext('2d');
        
        if (!overlayCtx) {
            console.error('❌ Contexto do overlay não encontrado!');
            setTimeout(detectFaces, 150);
            return;
        }
        
        overlayCtx.clearRect(0, 0, systemState.overlay.width, systemState.overlay.height);
        
        // Desenhar TODAS as detecções automaticamente
        if (detections.length > 0) {
            console.log(`🎯 SUCESSO! ${detections.length} face(s) detectada(s)! Desenhando quadrados AZUIS...`);
            
            // Log das posições para debug
            detections.forEach((detection, i) => {
                const { x, y, width, height } = detection.box;
                console.log(`  👤 Face ${i+1}: x=${Math.round(x)}, y=${Math.round(y)}, tamanho=${Math.round(width)}x${Math.round(height)}, confiança=${detection.score ? detection.score.toFixed(3) : 'N/A'}`);
            });
            
            drawDetections(detections, overlayCtx);
            updateStatus(`🔵 ${detections.length} pessoa(s) detectada(s)`, 'ok');
        } else {
            // Log ocasional quando não há detecções
            if (systemState.stats.detections % 300 === 0) {
                console.log('👁️ Analisando frame... nenhuma face detectada ainda (frame', systemState.stats.detections, ')');
            }
            updateStatus('🔍 Procurando pessoas...', 'ok');
        }
        
        // Log de debug periódico
        if (systemState.stats.detections % 500 === 0) {
            console.log(`📊 Debug: ${systemState.stats.detections} frames analisados, ${systemState.stats.errors} erros, ${systemState.stats.faces} faces na última detecção`);
        }
        
    } catch (error) {
        systemState.stats.errors++;
        if (systemState.stats.errors % 10 === 0) {
            console.error('❌ Erro na detecção:', error.message);
            console.error('🔧 Canvas válido:', !!systemState.canvas);
            console.error('🔧 Modelos carregados:', systemState.modelsLoaded);
        }
    }
    
    // Continuar detecção automaticamente - mais rápido
    setTimeout(detectFaces, 100);
}

function hasVideoData() {
    try {
        if (!systemState.canvas) {
            console.log('❌ Canvas não existe');
            return false;
        }
        
        const ctx = systemState.canvas.getContext('2d');
        if (!ctx) {
            console.log('❌ Contexto do canvas não existe');
            return false;
        }
        
        // Pegar uma amostra maior do canvas para verificar
        const imageData = ctx.getImageData(0, 0, 50, 50);
        const hasData = imageData && !imageData.data.every(val => val === 0);
        
        // Log ocasional para debug
        if (systemState.stats.detections % 100 === 0) {
            console.log('📸 Verificação de dados do vídeo:', hasData);
            if (hasData) {
                // Mostrar alguns valores de pixel para confirmar
                const sample = Array.from(imageData.data.slice(0, 12));
                console.log('🎨 Amostra de pixels:', sample);
            }
        }
        
        return hasData;
    } catch (e) {
        console.error('❌ Erro ao verificar dados do vídeo:', e.message);
        return false;
    }
}

function drawDetections(detections, ctx) {
    // Limpar overlay
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Configurar estilo - AZUL em vez de verde
    ctx.strokeStyle = '#0066FF'; // Azul
    ctx.lineWidth = 3; // Mais espesso para ser mais visível
    
    // Desenhar quadrados do tamanho exato dos rostos
    detections.forEach((detection, index) => {
        const { x, y, width, height } = detection.box;
        ctx.strokeRect(x, y, width, height);
        
        // Log para debug
        console.log(`🔵 Quadrado AZUL desenhado: Face ${index + 1} em (${Math.round(x)}, ${Math.round(y)}) - ${Math.round(width)}x${Math.round(height)}`);
    });
    
    console.log(`✅ ${detections.length} quadrados AZUIS desenhados no overlay`);
}

function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status ${type === 'ok' ? 'connected' : type === 'error' ? 'error' : 'warning'}`;
    }
}

// Função para testar manualmente o overlay
window.testOverlay = function() {
    console.log('🧪 TESTE MANUAL DO OVERLAY');
    
    if (!systemState.overlay) {
        console.error('❌ Overlay não encontrado');
        return;
    }
    
    const ctx = systemState.overlay.getContext('2d');
    ctx.clearRect(0, 0, systemState.overlay.width, systemState.overlay.height);
    
    // Desenhar quadrados de teste AZUIS
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 3;
    
    // Simular 3 faces detectadas
    ctx.strokeRect(100, 100, 80, 80);
    ctx.strokeRect(300, 150, 90, 90);
    ctx.strokeRect(450, 200, 70, 70);
    
    console.log('🔵 3 quadrados AZUIS de teste desenhados');
    
    setTimeout(() => {
        ctx.clearRect(0, 0, systemState.overlay.width, systemState.overlay.height);
        console.log('🧹 Teste removido');
    }, 5000);
};

// Função para forçar detecção manual
window.forceDetection = async function() {
    console.log('🔴 FORÇANDO DETECÇÃO MANUAL AGORA!');
    
    if (!systemState.modelsLoaded) {
        console.error('❌ Modelos não carregados ainda');
        return;
    }
    
    if (!systemState.canvas) {
        console.error('❌ Canvas não encontrado');
        return;
    }
    
    try {
        console.log('🎯 Executando detecção facial diretamente...');
        
        const detections = await faceapi
            .detectAllFaces(systemState.canvas, new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.05  // Muito baixo para pegar qualquer coisa
            }));
        
        console.log('📊 Resultado da detecção forçada:', detections.length, 'faces encontradas');
        
        if (detections.length > 0) {
            detections.forEach((det, i) => {
                console.log(`  Face ${i+1}:`, det.box);
            });
            
            // Desenhar imediatamente
            const ctx = systemState.overlay.getContext('2d');
            ctx.clearRect(0, 0, systemState.overlay.width, systemState.overlay.height);
            drawDetections(detections, ctx);
            
        } else {
            console.log('❌ Nenhuma face detectada na detecção forçada');
            
            // Verificar se há dados no canvas
            const hasData = hasVideoData();
            console.log('📸 Canvas tem dados:', hasData);
            
            // Salvar uma amostra do canvas para debug
            try {
                const dataURL = systemState.canvas.toDataURL('image/png');
                console.log('🖼️ Canvas data URL (primeiros 100 chars):', dataURL.substring(0, 100));
            } catch (e) {
                console.error('❌ Erro ao gerar data URL:', e.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro na detecção forçada:', error);
    }
};

// Salvar referências globais para debug
window.systemState = systemState;
window.debugInfo = () => {
    console.log('🔧 SISTEMA STATUS:');
    console.log('- Modelos carregados:', systemState.modelsLoaded);
    console.log('- Vídeo conectado:', systemState.videoConnected);
    console.log('- Detecção ativa:', systemState.detectionActive);
    console.log('- Frames analisados:', systemState.stats.detections);
    console.log('- Faces detectadas:', systemState.stats.faces);
    console.log('- Canvas presente:', !!systemState.canvas);
    console.log('- Overlay presente:', !!systemState.overlay);
    
    if (systemState.overlay) {
        const rect = systemState.overlay.getBoundingClientRect();
        console.log('- Overlay posição:', {x: rect.x, y: rect.y, w: rect.width, h: rect.height});
    }
};

console.log('✅ Sistema iniciado - detecção automática ativa');
console.log('💡 Digite testOverlay() no console para testar quadrados azuis');
console.log('💡 Digite forceDetection() no console para forçar detecção');
console.log('💡 Digite debugInfo() no console para ver status completo');
