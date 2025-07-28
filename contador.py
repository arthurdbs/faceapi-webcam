import cv2
from ultralytics import YOLO

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
people_count = 0

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

            # Lógica de contagem
            # Pega a posição anterior da pessoa.
            prev_position = tracked_people.get(track_id)

            # Se a pessoa já foi rastreada antes...
            if prev_position is not None:
                # ...e se ela cruzou a linha da esquerda para direita...
                if prev_position < line_x and center_x >= line_x:
                    people_count += 1
                    # Pinta a linha de vermelho no momento da contagem.
                    cv2.line(frame, (line_x, 0), (line_x, frame.shape[0]), (0, 0, 255), 2)

            # Atualiza a posição atual da pessoa.
            tracked_people[track_id] = center_x

    # Exibe informações na tela.
    cv2.putText(frame, f"Pessoas Contadas: {people_count}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f"Pessoas Detectadas: {len(track_ids) if 'track_ids' in locals() else 0}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(frame, "Pressione 'q' para sair", (10, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Mostra o frame resultante.
    cv2.imshow("Contador de Pessoas - YOLOv8", frame)

    # Pressione 'q' para sair do loop.
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Libera a captura de vídeo e fecha todas as janelas.
cap.release()
cv2.destroyAllWindows()