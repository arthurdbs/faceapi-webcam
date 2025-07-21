import cv2

# --- CONFIGURAÇÕES ---
# Altere com os dados da sua câmera Intelbras
RTSP_URL = 'rtsp://admin:APPIA-DADOOH@192.168.18.191:554/cam/realmonitor?channel=1&subtype=0'

# Caminho para o arquivo XML do classificador Haar Cascade
# Certifique-se de que este arquivo esteja na mesma pasta do script
HAAR_CASCADE_PATH = 'haarcascade_frontalface_default.xml'

# --- INICIALIZAÇÃO ---
# Carrega o classificador de detecção de rosto
try:
    face_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)
except Exception as e:
    print(f"Erro ao carregar o arquivo Haar Cascade: {e}")
    print(f"Verifique se o arquivo '{HAAR_CASCADE_PATH}' está no mesmo diretório do script.")
    exit()

# Inicializa a captura de vídeo a partir do stream RTSP da câmera
# O OpenCV tentará se conectar ao stream da câmera. Pode levar alguns segundos.
print("Conectando ao stream da câmera...")
cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)

# Verifica se a conexão com a câmera foi bem-sucedida
if not cap.isOpened():
    print("Erro: Não foi possível abrir o stream de vídeo.")
    print("Verifique a URL RTSP, o IP da câmera, usuário, senha e a conexão de rede.")
    exit()

print("Conexão estabelecida com sucesso! Pressione 'q' para sair.")

# --- LOOP PRINCIPAL ---
while True:
    # Lê um quadro (frame) do vídeo
    ret, frame = cap.read()

    # Se a leitura do quadro falhar, encerra o loop
    if not ret:
        print("Stream de vídeo perdido. Tentando reconectar...")
        cap.release()
        cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
        if not cap.isOpened():
            print("Não foi possível reconectar. Encerrando.")
            break
        continue

    # Converte o quadro para escala de cinza (a detecção de rosto é mais eficiente em escala de cinza)
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detecta rostos no quadro em escala de cinza
    # O método detectMultiScale retorna uma lista de retângulos (x, y, largura, altura) para cada rosto detectado
    faces = face_cascade.detectMultiScale(
        gray_frame,
        scaleFactor=1.1,  # Reduz o tamanho da imagem em 10% a cada passagem para encontrar rostos de diferentes tamanhos
        minNeighbors=5,   # Quantos vizinhos cada retângulo candidato deve ter para ser retido (ajuda a evitar falsos positivos)
        minSize=(30, 30)  # Tamanho mínimo do objeto a ser detectado (rostos menores que 30x30 pixels serão ignorados)
    )

    # Desenha os retângulos ("quadradinhos") em volta dos rostos detectados
    for (x, y, w, h) in faces:
        # Desenha o retângulo no quadro colorido original
        # Parâmetros: (imagem, ponto_inicial, ponto_final, cor_em_BGR, espessura_da_linha)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

    # Mostra o quadro resultante em uma janela chamada 'Detecção Facial'
    cv2.imshow('Detecção Facial - Pressione "q" para sair', frame)

    # Espera por uma tecla ser pressionada e verifica se é a tecla 'q' para sair
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# --- FINALIZAÇÃO ---
# Libera o objeto de captura de vídeo
cap.release()
# Fecha todas as janelas do OpenCV
cv2.destroyAllWindows()
print("Aplicação encerrada.")