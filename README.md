# 🎭 Detector de Rostos em Tempo Real

Aplicação simples para detecção facial em vídeos usando MediaPipe.

## 📋 Requisitos

- Python 3.10+
- OpenCV
- MediaPipe
- Numpy

## 🚀 Como Instalar e Rodar

### 1. Ativar o ambiente virtual
```bash
source .venv/bin/activate
```

### 2. Executar o programa
```bash
python processar_video.py
```

### 3. Usar a aplicação
1. O programa listará todos os vídeos disponíveis no diretório
2. Digite o número do vídeo que deseja processar
3. O vídeo abrirá em tela cheia com detecção facial
4. Use os controles para navegar

## 🎮 Controles

- **'q'** - Sair do programa
- **'f'** - Alternar entre tela cheia e janela

## 📊 Características

✅ **Velocidade Correta**: Mantém o FPS original do vídeo  
✅ **Detecção Otimizada**: Detecta rostos pequenos e ao fundo  
✅ **Tela Cheia**: Abre automaticamente em fullscreen  
✅ **Múltiplos Formatos**: Suporta MP4, AVI, MOV, MKV  
✅ **Seleção Simples**: Lista e permite escolher o vídeo  

## 🔧 Configurações Técnicas

- **Modelo**: MediaPipe Face Detection (modelo completo)
- **Confiança Mínima**: 0.3 (detecta mais rostos)
- **Sincronização**: FPS original do vídeo
- **Resolução**: Mantém resolução original

## 📁 Estrutura do Projeto

```
MediaPipe/
├── .venv/              # Ambiente virtual Python
├── processar_video.py  # Código principal
├── videoteste.mp4      # Vídeo de exemplo
└── README.md           # Este arquivo
```

## 🐛 Solução de Problemas

### Vídeo muito rápido ou lento
- O programa sincroniza automaticamente com o FPS do vídeo
- Se persistir, verifique se o arquivo de vídeo está íntegro

### Não detecta rostos pequenos
- A configuração já está otimizada para detectar rostos menores
- Rostos muito pequenos (< 20px) podem não ser detectados

### Erro ao abrir vídeo
- Verifique se o arquivo não está corrompido
- Formatos suportados: MP4, AVI, MOV, MKV

## 💡 Dicas de Uso

- Para melhor performance, use vídeos em resolução até 1920x1080
- Rostos bem iluminados são detectados com maior precisão
- O programa funciona melhor com rostos frontais

---

**Desenvolvido com MediaPipe e OpenCV**
