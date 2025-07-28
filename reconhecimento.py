import face_recognition
import cv2
import os
import numpy as np

# Caminho para a pasta com as fotos das pessoas conhecidas.
KNOWN_FACES_DIR = 'rostos_conhecidos'

# Carrega os rostos conhecidos e seus nomes.
known_face_encodings = []
known_face_names = []

print("Carregando rostos conhecidos...")
for filename in os.listdir(KNOWN_FACES_DIR):
    # Verifica se o arquivo é uma imagem.
    if filename.endswith(('.jpg', '.png', '.jpeg')):
        try:
            # Carrega a imagem.
            image = face_recognition.load_image_file(os.path.join(KNOWN_FACES_DIR, filename))
            # Pega a codificação do primeiro rosto encontrado na imagem.
            encodings = face_recognition.face_encodings(image)
            if len(encodings) > 0:
                encoding = encodings[0]
                # Adiciona a codificação e o nome (sem a extensão do arquivo) às listas.
                known_face_encodings.append(encoding)
                known_face_names.append(os.path.splitext(filename)[0])
                print(f"✓ Rosto carregado: {os.path.splitext(filename)[0]}")
            else:
                print(f"AVISO: Nenhum rosto encontrado em {filename}. O arquivo será ignorado.")
        except Exception as e:
            print(f"Erro ao processar {filename}: {e}")

print(f"Total de rostos conhecidos carregados: {len(known_face_encodings)}")
print("Pressione 'q' na janela de vídeo para sair.")
print("-" * 50)

# Inicia a captura de vídeo da webcam.
cap = cv2.VideoCapture(0)

while True:
    # Lê um frame da webcam.
    ret, frame = cap.read()
    if not ret:
        break

    # Encontra todos os rostos e suas codificações no frame atual.
    # É mais eficiente fazer isso em um frame menor.
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
    
    face_locations = face_recognition.face_locations(rgb_small_frame)
    face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

    # Itera sobre cada rosto encontrado.
    for face_encoding, face_location in zip(face_encodings, face_locations):
        # Compara o rosto encontrado com todos os rostos conhecidos.
        # Tolerância mais baixa para ser mais rigoroso (0.4 em vez de 0.6)
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.5)
        name = "Desconhecido"

        # Encontra a melhor correspondência.
        if len(known_face_encodings) > 0:
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            best_match_index = np.argmin(face_distances)
            
            # Verifica se há match E se a distância é suficientemente baixa (< 0.4)
            if matches[best_match_index] and face_distances[best_match_index] < 0.4:
                name = known_face_names[best_match_index].title() # Deixa o nome com a primeira letra maiúscula.
                # Adiciona a confiança na exibição
                confidence = round((1 - face_distances[best_match_index]) * 100, 1)
                name = f"{name} ({confidence}%)"

        # Redimensiona as coordenadas do rosto de volta para o tamanho original do frame.
        top, right, bottom, left = face_location
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        # Define cor baseada no reconhecimento (Verde para conhecido, Vermelho para desconhecido)
        if name.startswith("Desconhecido"):
            color = (0, 0, 255)  # Vermelho para desconhecidos
        else:
            color = (0, 255, 0)  # Verde para conhecidos

        # Desenha uma caixa ao redor do rosto.
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)

        # Desenha uma etiqueta com o nome abaixo do rosto.
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
        cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.8, (255, 255, 255), 1)

    # Mostra o frame resultante.
    cv2.imshow('Reconhecimento Facial - Dlib', frame)

    # Pressione 'q' para sair do loop.
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Libera a captura de vídeo e fecha todas as janelas.
cap.release()
cv2.destroyAllWindows()