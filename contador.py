import cv2
from ultralytics import YOLO
import os
import glob

def listar_videos():
    """Lista todos os vídeos disponíveis na pasta atual."""
    extensoes = ['*.mp4', '*.avi', '*.mov', '*.mkv', '*.webm']
    videos = []
    
    for ext in extensoes:
        videos.extend(glob.glob(ext))
    
    return sorted(videos)

def escolher_video():
    """Permite ao usuário escolher um vídeo da lista."""
    videos = listar_videos()
    
    if not videos:
        print("Nenhum vídeo encontrado na pasta atual!")
        print("Formatos suportados: .mp4, .avi, .mov, .mkv, .webm")
        return None
    
    print("=== VÍDEOS DISPONÍVEIS ===")
    for i, video in enumerate(videos, 1):
        print(f"{i}. {video}")
    
    print("0. Usar webcam")
    print("===========================")
    
    try:
        escolha = int(input("Escolha um vídeo (número): "))
        
        if escolha == 0:
            return "webcam"
        elif 1 <= escolha <= len(videos):
            return videos[escolha - 1]
        else:
            print("Escolha inválida!")
            return None
    except ValueError:
        print("Por favor, digite um número válido!")
        return None

print("=== CONTADOR DE FLUXO ===")
print("Esquerda → Direita = ENTRADA")
print("Direita → Esquerda = SAÍDA")
print("Teclas: 'q' = sair | 'r' = resetar | 'f' = tela cheia")
print("============================")

# Escolhe o vídeo
video_escolhido = escolher_video()
if video_escolhido is None:
    exit()

# Carrega o modelo YOLOv8n (nano), que é leve e rápido.
# O modelo será baixado automaticamente na primeira vez.
model = YOLO('yolov8n.pt')

# Configura a captura de vídeo baseada na escolha
if video_escolhido == "webcam":
    print("Usando webcam...")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Erro: Não foi possível abrir a webcam.")
        exit()
else:
    print(f"Carregando vídeo: {video_escolhido}")
    cap = cv2.VideoCapture(video_escolhido)
    if not cap.isOpened():
        print(f"Erro: Não foi possível abrir o vídeo '{video_escolhido}'.")
        exit()
    
    # Mostra informações do vídeo
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    print(f"FPS: {fps:.2f} | Frames: {total_frames} | Duração: {duration:.1f}s")

# Obtém as dimensões do vídeo para desenhar a linha no meio.
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
line_x = frame_width // 2  # Linha vertical no meio da tela

# Controles específicos para vídeo
is_video = (video_escolhido != "webcam")
paused = False
playback_speed = 3.0  # Velocidade rápida por padrão
frame_skip = 2  # Pula frames para mais velocidade

# Configura FPS para cálculo correto do timing
if is_video:
    video_fps = cap.get(cv2.CAP_PROP_FPS) if cap.get(cv2.CAP_PROP_FPS) > 0 else 30
else:
    video_fps = 30  # FPS padrão para webcam

if is_video:
    print("Controles de vídeo: 'espaço'=pausar | '+/-'=velocidade | '1/2'=velocidades")
    print("============================")

# Dicionário para rastrear a posição anterior das pessoas detectadas.
# A chave é o ID de rastreamento da pessoa, o valor é sua última posição X.
tracked_people = {}

# Contadores
people_inside = 0  # Pessoas atualmente dentro do local
people_entered = 0  # Total de pessoas que entraram
people_exited = 0   # Total de pessoas que saíram
total_passages = 0  # Total de passagens (entradas + saídas)

# Controle de tela cheia
fullscreen = False

# Cria a janela
window_name = "Contador de Fluxo"
cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

while True:
    # Controla a reprodução se for vídeo
    if not paused or not is_video:
        # Lê um frame
        success, frame = cap.read()
        
        # Pula frames para mais velocidade se for vídeo
        if is_video and success:
            for _ in range(frame_skip):
                cap.read()  # Pula frames adicionais
        
        if not success:
            if is_video:
                print("Fim do vídeo atingido.")
                restart = input("Reiniciar vídeo? (s/n): ").lower()
                if restart == 's':
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    people_inside = 0
                    people_entered = 0
                    people_exited = 0
                    total_passages = 0
                    tracked_people.clear()
                    continue
                else:
                    break
            else:
                print("Erro: Não foi possível ler frame da webcam.")
                break

    try:
        # Usa o rastreador do YOLO para detectar e rastrear objetos.
        # 'persist=True' mantém o rastreamento entre os frames.
        # 'classes=0' filtra para detectar apenas a classe 'person'.
        results = model.track(frame, persist=True, classes=0, verbose=False)
    except Exception as e:
        print(f"Erro na detecção: {e}")
        continue

    # Desenha a linha de contagem vertical no meio da tela.
    cv2.line(frame, (line_x, 0), (line_x, frame.shape[0]), (0, 255, 0), 2)

    # Verifica se há algum rastreamento no resultado.
    if results and results[0].boxes is not None and results[0].boxes.id is not None:
        # Extrai as caixas delimitadoras, os IDs de rastreamento e as classes.
        boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)
        track_ids = results[0].boxes.id.cpu().numpy().astype(int)

        # Itera sobre cada pessoa detectada.
        for box, track_id in zip(boxes, track_ids):
            x1, y1, x2, y2 = box
            
            # Desenha a caixa delimitadora ao redor da pessoa.
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            
            # Calcula o centro da caixa delimitadora no eixo X.
            center_x = (x1 + x2) // 2

            # Lógica de contagem bidirecional
            # Pega a posição anterior da pessoa.
            prev_position = tracked_people.get(track_id)

            # Se a pessoa já foi rastreada antes...
            if prev_position is not None:
                # Verifica se cruzou a linha da esquerda para direita (ENTRADA)
                if prev_position < line_x and center_x >= line_x:
                    people_inside += 1
                    people_entered += 1
                    total_passages += 1
                    # Pinta a linha de verde no momento da entrada.
                    cv2.line(frame, (line_x, 0), (line_x, frame.shape[0]), (0, 255, 0), 4)
                
                # Verifica se cruzou a linha da direita para esquerda (SAÍDA)
                elif prev_position > line_x and center_x <= line_x:
                    people_inside = max(0, people_inside - 1)  # Evita números negativos
                    people_exited += 1
                    total_passages += 1
                    # Pinta a linha de vermelho no momento da saída.
                    cv2.line(frame, (line_x, 0), (line_x, frame.shape[0]), (0, 0, 255), 4)

            # Atualiza a posição atual da pessoa.
            tracked_people[track_id] = center_x

    # Exibe informações na tela de forma limpa.
    cv2.putText(frame, f"Pessoas no Local: {people_inside}", (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
    cv2.putText(frame, f"Total de Passagens: {total_passages}", (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    
    # Informações específicas do vídeo
    if is_video:
        current_frame = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if fps > 0 and total_frames > 0:
            current_time = current_frame / fps
            total_time = total_frames / fps
            progress = (current_frame / total_frames) * 100
            
            cv2.putText(frame, f"Tempo: {current_time:.1f}/{total_time:.1f}s ({progress:.1f}%)", 
                        (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, f"Velocidade: {playback_speed:.1f}x", 
                        (10, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        if paused:
            cv2.putText(frame, "PAUSADO", (frame.shape[1] - 150, 40), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
    
    # Indicadores de entrada e saída nas laterais da linha
    y_offset = 60 if is_video else 30
    cv2.putText(frame, "SAIDA", (line_x - 120, frame.shape[0] - y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    cv2.putText(frame, "ENTRADA", (line_x + 20, frame.shape[0] - y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    # Mostra controles apenas se não estiver em tela cheia
    if not fullscreen:
        controls_y = frame.shape[0] - 40 if is_video else frame.shape[0] - 20
        if is_video:
            cv2.putText(frame, "q=sair | r=reset | f=tela | espaco=pausar | +/-=velocidade | 1/2=vel", 
                        (10, controls_y), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 200, 200), 1)
        else:
            cv2.putText(frame, "q=sair | r=reset | f=tela cheia", 
                        (10, controls_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    # Mostra o frame resultante.
    cv2.imshow(window_name, frame)

    # Timing ultra-rápido
    wait_time = 1  # Sempre 1ms para máxima velocidade

    # Controles do teclado.
    key = cv2.waitKey(wait_time) & 0xFF
    if key == ord('q') or key == 27:  # 'q' ou ESC
        break
    elif key == ord(' ') and is_video:
        # Pausa/despausa o vídeo
        paused = not paused
    elif key == ord('f'):
        # Alterna entre tela cheia e modo janela (tecla 'f')
        fullscreen = not fullscreen
        if fullscreen:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        else:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)

# Libera a captura de vídeo e fecha todas as janelas.
cap.release()
cv2.destroyAllWindows()