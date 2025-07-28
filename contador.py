import cv2
from ultralytics import YOLO

print("=== CONTADOR DE FLUXO ===")
print("Esquerda → Direita = ENTRADA")
print("Direita → Esquerda = SAÍDA")
print("Teclas: 'q' = sair | 'r' = resetar | 'f' = tela cheia")
print("============================")

# Carrega o modelo YOLOv8n (nano), que é leve e rápido.
# O modelo será baixado automaticamente na primeira vez.
model = YOLO('yolov8n.pt')

# Inicia a captura de vídeo da webcam (geralmente o índice 0).
cap = cv2.VideoCapture(0)

# Verifica se a webcam foi aberta corretamente.
if not cap.isOpened():
    print("Erro: Não foi possível abrir a webcam.")
    exit()

# Obtém as dimensões do vídeo para desenhar a linha no meio.
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
line_x = frame_width // 2  # Linha vertical no meio da tela

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
    # Lê um frame da webcam.
    success, frame = cap.read()
    if not success:
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
    if results[0].boxes is not None and results[0].boxes.id is not None:
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
    
    # Indicadores de entrada e saída nas laterais da linha
    cv2.putText(frame, "SAIDA", (line_x - 120, frame.shape[0] - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    cv2.putText(frame, "ENTRADA", (line_x + 20, frame.shape[0] - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    # Mostra controles apenas se não estiver em tela cheia
    if not fullscreen:
        cv2.putText(frame, "q=sair | r=reset | f=tela cheia", (10, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    # Mostra o frame resultante.
    cv2.imshow(window_name, frame)

    # Controles do teclado.
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('r'):
        # Reset dos contadores (tecla 'r')
        people_inside = 0
        people_entered = 0
        people_exited = 0
        total_passages = 0
        tracked_people.clear()
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