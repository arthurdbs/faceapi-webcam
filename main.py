import cv2
import mediapipe as mp
import os
import time
import numpy as np
from improved_emotion_detector import ImprovedEmotionDetector

def listar_videos():
    """Lista vídeos no diretório"""
    videos = []
    for arquivo in os.listdir('.'):
        if arquivo.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
            videos.append(arquivo)
    return videos

def processar_camera():
    """Processa a câmera para detectar rostos e emoções em tempo real."""
    
    # Inicializar MediaPipe
    mp_face_detection = mp.solutions.face_detection
    mp_drawing = mp.solutions.drawing_utils
    
    # Inicializar detector de emoções melhorado
    print("🚀 Carregando detector de emoções para câmera...")
    emotion_detector = ImprovedEmotionDetector()
    print("✅ Detector carregado!")
    
    # Abrir câmera
    cap = cv2.VideoCapture(0)  # 0 = câmera padrão
    
    if not cap.isOpened():
        print("❌ Erro ao abrir a câmera!")
        print("💡 Verifique se sua câmera está conectada e funcionando")
        return
    
    # Configurar câmera para melhor performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    print("📹 Câmera inicializada!")
    print("\n🎮 Controles:")
    print("  'q' - Sair")
    print("  'f' - Alternar tela cheia")
    print("  'e' - Alternar detecção de emoção")
    print("  'space' - Pausar/Retomar")
    print("  's' - Salvar screenshot")
    
    # Criar janela
    window_name = 'Câmera - Detecção Facial e Emoções'
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    
    # Variáveis de controle
    detect_emotions = True
    paused = False
    frame_count = 0
    skip_frames = 1  # Para câmera, processar mais frequentemente
    emotion_results = {}
    
    # Processar com MediaPipe
    with mp_face_detection.FaceDetection(
        model_selection=0,  # Modelo mais rápido para câmera
        min_detection_confidence=0.5
    ) as face_detection:
        
        while True:
            if not paused:
                ret, frame = cap.read()
                
                if not ret:
                    print("❌ Erro ao capturar frame da câmera!")
                    break
                
                frame_count += 1
                
                # Espelhar imagem (como um espelho)
                frame = cv2.flip(frame, 1)
                
                # Converter BGR para RGB para MediaPipe
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Detectar rostos
                results = face_detection.process(rgb_frame)
                
                # Adicionar informações na tela
                info_text = f"Frame: {frame_count} | Câmera ao vivo"
                cv2.putText(frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                emotion_status = "🎭 ON" if detect_emotions else "❌ OFF"
                cv2.putText(frame, f"Emotions: {emotion_status}", (10, 55), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0) if detect_emotions else (0, 0, 255), 2)
                
                # Processar detecções de rostos
                if results.detections:
                    h, w, _ = frame.shape
                    
                    for i, detection in enumerate(results.detections):
                        # Desenhar detecção básica do MediaPipe
                        mp_drawing.draw_detection(frame, detection)
                        
                        if detect_emotions:
                            try:
                                # Extrair coordenadas do rosto
                                bbox = detection.location_data.relative_bounding_box
                                x = max(0, int(bbox.xmin * w))
                                y = max(0, int(bbox.ymin * h))
                                width = min(int(bbox.width * w), w - x)
                                height = min(int(bbox.height * h), h - y)
                                
                                # Verificar tamanho mínimo para processamento
                                if width > 50 and height > 50:
                                    face_key = f"{i}_{x}_{y}_{frame_count//10}"  # Atualizar cache mais frequentemente
                                    
                                    # Processar emoções
                                    if frame_count % (skip_frames + 1) == 0 or face_key not in emotion_results:
                                        # Extrair região do rosto com margem
                                        margin = 10
                                        x_start = max(0, x - margin)
                                        y_start = max(0, y - margin)
                                        x_end = min(w, x + width + margin)
                                        y_end = min(h, y + height + margin)
                                        
                                        face_roi = frame[y_start:y_end, x_start:x_end]
                                        
                                        if face_roi.size > 0:
                                            # Detectar emoção
                                            emotion, confidence = emotion_detector.predict_emotion_with_rules(face_roi)
                                            emotion_results[face_key] = (emotion, confidence)
                                    
                                    # Usar resultado em cache
                                    if face_key in emotion_results:
                                        emotion, confidence = emotion_results[face_key]
                                        
                                                                                # Filtrar resultados com baixa confiança
                                        if confidence > 0.25:  # Threshold mais baixo para mais resultados
                                            # Obter cor da emoção
                                            color = emotion_detector.get_emotion_color(emotion)
                                            
                                            # Criar texto da emoção simplificado para performance
                                            emotion_text = f"{emotion}: {confidence:.1f}"  # Menos decimais
                                            
                                            # Desenhar fundo do texto mais simples
                                            text_size = cv2.getTextSize(emotion_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                                            text_x = x + 5
                                            text_y = y - 10
                                            
                                            # Retângulo de fundo mais simples
                                            cv2.rectangle(frame, (text_x - 2, text_y - text_size[1] - 4), 
                                                        (text_x + text_size[0] + 4, text_y + 4), color, -1)
                                            
                                            # Texto da emoção
                                            cv2.putText(frame, emotion_text, (text_x, text_y), 
                                                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)  # Espessura reduzida
                                
                            except Exception as e:
                                print(f"⚠️  Erro ao processar rosto {i}: {e}")
                
                # Limpar cache agressivamente
                if frame_count % 30 == 0:  # Limpar mais frequentemente
                    emotion_results.clear()
                    emotion_detector.clear_cache()
            
            # Mostrar frame sem delay para máxima velocidade
            cv2.imshow(window_name, frame)
            
            # Controles de teclado ultra-responsivos
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('f'):
                # Alternar tela cheia
                prop = cv2.getWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN)
                if prop == cv2.WINDOW_FULLSCREEN:
                    cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                else:
                    cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
            elif key == ord('e'):
                # Alternar detecção de emoções
                detect_emotions = not detect_emotions
                status = "ativada" if detect_emotions else "desativada"
                print(f"🎭 Detecção de emoções {status}")
                if not detect_emotions:
                    emotion_results.clear()
            elif key == ord(' '):
                # Pausar/retomar
                paused = not paused
                status = "pausado" if paused else "retomado"
                print(f"⏯️  Câmera {status}")
            elif key == ord('s'):
                # Salvar screenshot
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                filename = f"screenshot_{timestamp}.jpg"
                cv2.imwrite(filename, frame)
                print(f"📸 Screenshot salvo: {filename}")
    
    cap.release()
    cv2.destroyAllWindows()
    print("✅ Câmera finalizada!")

def processar_video_otimizado(video_file):
    """Processa um vídeo para detectar rostos e emoções com performance otimizada."""
    
    if not os.path.exists(video_file):
        print(f"Erro: Arquivo '{video_file}' não encontrado.")
        return
    
    # Inicializar MediaPipe
    mp_face_detection = mp.solutions.face_detection
    mp_drawing = mp.solutions.drawing_utils
    
    # Inicializar detector de emoções melhorado
    print("🚀 Carregando detector de emoções melhorado...")
    emotion_detector = ImprovedEmotionDetector()
    print("✅ Detector carregado!")
    
    # Abrir vídeo
    cap = cv2.VideoCapture(video_file)
    
    if not cap.isOpened():
        print("Erro ao abrir o vídeo!")
        return
    
    # Obter informações do vídeo
    fps_original = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Otimizações ultra-agressivas de performance
    frame_delay = 0.001  # Delay mínimo para máxima velocidade
    
    print(f"📹 Processando: {video_file}")
    print(f"📊 FPS original: {fps_original:.1f}")
    print(f"📏 Total de frames: {total_frames}")
    print("\n🎮 Controles:")
    print("  'q' - Sair")
    print("  'f' - Alternar tela cheia")
    print("  'e' - Alternar detecção de emoção")
    print("  'space' - Pausar/Retomar")
    print("  'r' - Reiniciar vídeo")
    
    # Criar janela ultra-otimizada
    window_name = 'Detecção Facial e Emoções - Ultra Rápido'
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
    
    # Variáveis de controle ultra-otimizadas
    detect_emotions = True
    paused = False
    frame_count = 0
    skip_frames = 5  # Processar emoções 1 a cada 6 frames para máxima performance
    emotion_results = {}  # Cache de resultados de emoções
    last_emotion_frame = 0
    
    # Processar com MediaPipe - configuração ultra-otimizada para velocidade
    with mp_face_detection.FaceDetection(
        model_selection=1,  # Modelo para vídeo (mais rápido)
        min_detection_confidence=0.6  # Confiança alta para reduzir falsos positivos e economizar processamento
    ) as face_detection:
        
        while cap.isOpened():
            if not paused:
                start_time = time.time()
                
                ret, frame = cap.read()
                
                if not ret:
                    print("📹 Fim do vídeo alcançado!")
                    break
                
                frame_count += 1
                
                # Reduzir resolução agressivamente para máxima velocidade
                height, width = frame.shape[:2]
                if width > 960:  # Reduzir ainda mais
                    scale = 960 / width
                    new_width = int(width * scale)
                    new_height = int(height * scale)
                    frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
                
                # Converter BGR para RGB para MediaPipe
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Detectar rostos
                results = face_detection.process(rgb_frame)
                
                # Adicionar informações na tela
                progress = (frame_count / total_frames) * 100 if total_frames > 0 else 0
                info_text = f"Frame: {frame_count}/{total_frames} ({progress:.1f}%) | FPS: {fps_original:.1f}"
                cv2.putText(frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                emotion_status = "🎭 ON" if detect_emotions else "❌ OFF"
                cv2.putText(frame, f"Emotions: {emotion_status}", (10, 55), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0) if detect_emotions else (0, 0, 255), 2)
                
                # Processar detecções de rostos
                if results.detections:
                    h, w, _ = frame.shape
                    
                    for i, detection in enumerate(results.detections):
                        # Desenhar detecção básica do MediaPipe
                        mp_drawing.draw_detection(frame, detection)
                        
                        if detect_emotions:
                            try:
                                # Extrair coordenadas do rosto
                                bbox = detection.location_data.relative_bounding_box
                                x = max(0, int(bbox.xmin * w))
                                y = max(0, int(bbox.ymin * h))
                                width = min(int(bbox.width * w), w - x)
                                height = min(int(bbox.height * h), h - y)
                                
                                # Verificar tamanho mínimo para processamento
                                if width > 40 and height > 40:  # Reduzir threshold
                                    face_key = f"{i}_{x//20}_{y//20}"  # Cache mais agressivo
                                    
                                    # Processar emoções ultra-otimizado - apenas em frames específicos
                                    if (frame_count - last_emotion_frame) > skip_frames or face_key not in emotion_results:
                                        # Extrair região do rosto com margem menor
                                        margin = 5  # Margem reduzida
                                        x_start = max(0, x - margin)
                                        y_start = max(0, y - margin)
                                        x_end = min(w, x + width + margin)
                                        y_end = min(h, y + height + margin)
                                        
                                        face_roi = frame[y_start:y_end, x_start:x_end]
                                        
                                        if face_roi.size > 0:
                                            # Reduzir tamanho do ROI para processamento mais rápido
                                            face_roi = cv2.resize(face_roi, (48, 48), interpolation=cv2.INTER_LINEAR)
                                            
                                            # Detectar emoção com o detector melhorado
                                            emotion, confidence = emotion_detector.predict_emotion_with_rules(face_roi)
                                            emotion_results[face_key] = (emotion, confidence)
                                            last_emotion_frame = frame_count
                                    
                                    # Usar resultado em cache
                                    if face_key in emotion_results:
                                        emotion, confidence = emotion_results[face_key]
                                        
                                        # Filtrar resultados com baixa confiança
                                        if confidence > 0.3:
                                            # Obter cor da emoção
                                            color = emotion_detector.get_emotion_color(emotion)
                                            
                                            # Criar texto da emoção com melhor formatação
                                            emotion_text = f"{emotion}: {confidence:.2f}"
                                            
                                            # Posição otimizada do texto
                                            text_x = x
                                            text_y = max(25, y - 10)
                                            
                                            # Desenhar fundo semi-transparente
                                            text_size = cv2.getTextSize(emotion_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]
                                            overlay = frame.copy()
                                            cv2.rectangle(overlay, (text_x, text_y - text_size[1] - 10), 
                                                        (text_x + text_size[0] + 10, text_y + 5), (0, 0, 0), -1)
                                            cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
                                            
                                            # Desenhar texto da emoção
                                            cv2.putText(frame, emotion_text, (text_x + 5, text_y), 
                                                      cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                                            
                                            # Adicionar indicador de confiança
                                            confidence_bar_width = int(confidence * 50)
                                            cv2.rectangle(frame, (text_x, text_y + 10), 
                                                        (text_x + confidence_bar_width, text_y + 15), color, -1)
                                            cv2.rectangle(frame, (text_x, text_y + 10), 
                                                        (text_x + 50, text_y + 15), (255, 255, 255), 1)
                                
                            except Exception as e:
                                print(f"⚠️  Erro ao processar rosto {i}: {e}")
                
                # Limpar cache antigo para evitar uso excessivo de memória
                if frame_count % 100 == 0:
                    emotion_results.clear()
                    emotion_detector.clear_cache()
                
                # Controle de velocidade otimizado - menos processamento desnecessário
                elapsed_time = time.time() - start_time
                sleep_time = max(0, frame_delay - elapsed_time)
                # Só fazer sleep se realmente necessário
                if sleep_time > 0.001:  # Reduzir threshold para melhor fluidez
                    time.sleep(sleep_time)
            
            # Mostrar frame
            cv2.imshow(window_name, frame)
            
            # Controles de teclado
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('f'):
                # Alternar tela cheia
                prop = cv2.getWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN)
                if prop == cv2.WINDOW_FULLSCREEN:
                    cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                else:
                    cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
            elif key == ord('e'):
                # Alternar detecção de emoções
                detect_emotions = not detect_emotions
                status = "ativada" if detect_emotions else "desativada"
                print(f"🎭 Detecção de emoções {status}")
                if not detect_emotions:
                    emotion_results.clear()
            elif key == ord(' '):
                # Pausar/retomar
                paused = not paused
                status = "pausado" if paused else "retomado"
                print(f"⏯️  Vídeo {status}")
            elif key == ord('r'):
                # Reiniciar vídeo
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                frame_count = 0
                emotion_results.clear()
                print("🔄 Vídeo reiniciado")
    
    cap.release()
    cv2.destroyAllWindows()
    print("✅ Processamento concluído!")

if __name__ == '__main__':
    print("🎭 Detector de Rostos e Emoções")
    print("=" * 40)
    print("Escolha uma opção:")
    print("1. Processar vídeo")
    print("2. Usar câmera ao vivo")
    print("3. Sair")
    
    try:
        opcao = int(input("\n📝 Digite sua escolha (1-3): "))
        
        if opcao == 1:
            # Processar vídeo
            videos = listar_videos()
            
            if not videos:
                print("❌ Nenhum vídeo encontrado na pasta atual!")
                print("💡 Adicione arquivos .mp4, .avi, .mov ou .mkv")
            else:
                print("\n🎬 Vídeos disponíveis:")
                for i, video in enumerate(videos):
                    print(f"  {i+1}. {video}")
                
                escolha = int(input("\n📝 Digite o número do vídeo: ")) - 1
                
                if 0 <= escolha < len(videos):
                    processar_video_otimizado(videos[escolha])
                else:
                    print("❌ Escolha inválida!")
        
        elif opcao == 2:
            # Usar câmera
            processar_camera()
        
        elif opcao == 3:
            print("👋 Até mais!")
        
        else:
            print("❌ Opção inválida!")
            
    except (ValueError, KeyboardInterrupt):
        print("\n⏹️  Operação cancelada.")
