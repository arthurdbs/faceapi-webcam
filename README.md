# 🚶‍♂️ Contador de Fluxo - YOLOv8

Contador de pessoas em tempo real usando webcam e inteligência artificial.

## 📋 Pré-requisitos

- Python 3.10+
- Webcam conectada
- Linux/Ubuntu

## 🚀 Instalação Rápida

1. **Clone/Baixe o projeto**
   ```bash
   # Ou simplesmente baixe os arquivos: contador.py e yolov8n.pt
   ```

2. **Execute o script**
   ```bash
   python contador.py
   ```

## 🎮 Como Usar

- **Entrada**: Pessoa cruza da esquerda → direita
- **Saída**: Pessoa cruza da direita → esquerda

### Controles:
- `q` - Sair
- `r` - Resetar contadores
- `f` - Tela cheia

## 📊 Interface

```
Pessoas no Local: 5
Total de Passagens: 23

    SAIDA     |     ENTRADA
              |
```

## 🔧 Dependências

O script instalará automaticamente:
- `ultralytics` (YOLOv8)
- `opencv-python`
- `lap` (rastreamento)

## ⚠️ Problemas?

Se der erro de permissão, rode:
```bash
pip install --user ultralytics opencv-python lap
```

## 📱 Funcionalidades

✅ Contagem bidirecional  
✅ Rastreamento em tempo real  
✅ Interface limpa  
✅ Modo tela cheia  
✅ Reset de contadores
