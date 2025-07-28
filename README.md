RECONHECIMENTO FACIAL - COMO USAR
==================================

REQUISITOS:
- Ubuntu/Linux
- Python 3.10+
- Webcam

INSTALAÇÃO:
1. sudo apt update
2. sudo apt install build-essential cmake libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev
3. source .venv/bin/activate
4. pip install opencv-python dlib face_recognition

COMO USAR:
1. Adicione fotos na pasta rostos_conhecidos/
   - Exemplo: rostos_conhecidos/joao.jpg
   - O nome do arquivo vira o nome exibido

2. Execute: python reconhecimento.py

3. Pressione 'q' para sair

DICAS:
- Use fotos com boa iluminação
- Rosto bem visível na foto
- Se reconhecer errado, mude tolerance=0.5 para 0.3 no código

CORES:
- Verde = pessoa conhecida
- Vermelho = desconhecido
