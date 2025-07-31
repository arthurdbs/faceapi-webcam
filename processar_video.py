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

def processar_video(video_file):
    """Processa um vídeo para detectar rostos e emoções usando MediaPipe e FER2013."""
    
    if not os.path.exists(video_file):
        print(f"Erro: Arquivo '{video_file}' não encontrado.")
        return
    
    # Inicializar MediaPipe
    mp_face_detection = mp.solutions.face_detection
    mp_drawing = mp.solutions.drawing_utils
    
    # Inicializar detector de emoções
    print("Carregando detector de emoções...")
    emotion_detector = ImprovedEmotionDetector()
    print("Detector de emoções carregado!")
    
    # Abrir vídeo
    cap = cv2.VideoCapture(video_file)
    
    if not cap.isOpened():
        print("Erro ao abrir o vídeo!")
        return
    
    # Obter FPS do vídeo original
    fps_original = cap.get(cv2.CAP_PROP_FPS)
    frame_delay = 1.0 / fps_original if fps_original > 0 else 1.0/30.0
    
    print(f"Processando: {video_file}")
    print(f"FPS original: {fps_original}")
    print("Pressione 'q' para sair | 'f' para tela cheia | 'e' para alternar detecção de emoção")
    
    # Criar janela em tela cheia
    cv2.namedWindow('Detecção Facial e Emoções', cv2.WINDOW_NORMAL)
    cv2.setWindowProperty('Detecção Facial e Emoções', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
    
    # Variável para controlar detecção de emoções
    detect_emotions = True
    
    # Processar com MediaPipe - configuração otimizada
    with mp_face_detection.FaceDetection(
        model_selection=1,  # Modelo mais completo para detectar rostos menores
        min_detection_confidence=0.3  # Detecta mais rostos (inclusive ao fundo)
    ) as face_detection:
        
        while cap.isOpened():
            start_time = time.time()
            
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Converter BGR para RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Detectar rostos
            results = face_detection.process(rgb_frame)
            
            # Desenhar detecções e processar emoções
            if results.detections:
                h, w, _ = frame.shape
                
                for detection in results.detections:
                    # Desenhar o retângulo da detecção
                    mp_drawing.draw_detection(frame, detection)
                    
                    if detect_emotions:
                        # Extrair coordenadas do rosto
                        bbox = detection.location_data.relative_bounding_box
                        x = int(bbox.xmin * w)
                        y = int(bbox.ymin * h)
                        width = int(bbox.width * w)
                        height = int(bbox.height * h)
                        
                        # Garantir que as coordenadas estão dentro dos limites
                        x = max(0, x)
                        y = max(0, y)
                        width = min(width, w - x)
                        height = min(height, h - y)
                        
                        if width > 0 and height > 0:
                            # Extrair região do rosto
                            face_roi = frame[y:y+height, x:x+width]
                            
                            if face_roi.size > 0:
                                # Detectar emoção com o método correto
                                emotion, confidence = emotion_detector.predict_emotion_with_rules(face_roi)
                                
                                # Desenhar texto da emoção
                                emotion_text = f"{emotion}: {confidence:.2f}"
                                
                                # Obter cor da emoção
                                color = emotion_detector.get_emotion_color(emotion)
                                
                                # Desenhar texto da emoção
                                cv2.putText(frame, emotion_text, 
                                          (x, y - 10), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 
                                          0.7, color, 2)
            
            # Mostrar frame
            cv2.imshow('Detecção Facial e Emoções', frame)
            
            # Controle de velocidade - sincronizar com FPS original
            elapsed_time = time.time() - start_time
            sleep_time = max(0, frame_delay - elapsed_time)
            time.sleep(sleep_time)
            
            # Controles
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('f'):
                # Alternar tela cheia
                prop = cv2.getWindowProperty('Detecção Facial e Emoções', cv2.WND_PROP_FULLSCREEN)
                if prop == cv2.WINDOW_FULLSCREEN:
                    cv2.setWindowProperty('Detecção Facial e Emoções', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                else:
                    cv2.setWindowProperty('Detecção Facial e Emoções', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
            elif key == ord('e'):
                # Alternar detecção de emoções
                detect_emotions = not detect_emotions
                status = "ativada" if detect_emotions else "desativada"
                print(f"Detecção de emoções {status}")
    
    cap.release()
    cv2.destroyAllWindows()
    print("Processamento concluído!")

if __name__ == '__main__':
    # Listar vídeos
    videos = listar_videos()
    
    if not videos:
        print("Nenhum vídeo encontrado!")
    else:
        print("Vídeos disponíveis:")
        for i, video in enumerate(videos):
            print(f"{i+1}. {video}")
        
        # Escolher vídeo
        escolha = int(input("Digite o número do vídeo: ")) - 1
        
        if 0 <= escolha < len(videos):
            processar_video(videos[escolha])
        else:
            print("Escolha inválida!")