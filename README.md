# 📹 Sistema de Detecção Facial - iME 360 C

Sistema web robusto para transmissão RTSP e detecção facial em tempo real usando face-api.js com câmera de segurança iME 360 C.

## ✨ Características

- 🎯 **Detecção Facial em Tempo Real**: IA avançada com face-api.js
- ⚡ **Performance Otimizada**: 15+ FPS com baixa latência
- 🔒 **Processamento Local**: Sem envio de dados para servidores externos
- 📱 **Interface Responsiva**: Funciona em desktop e mobile
- 🛠️ **Debug Avançado**: Logs detalhados e ferramentas de diagnóstico
- 🎨 **Overlay Inteligente**: Detecções desenhadas sobre o vídeo sem interferir
- 🔄 **Auto-Instalação**: Script de instalação e configuração automática
- � **Monitoramento**: Sistema de monitoramento contínuo
- 💾 **Backup Automático**: Sistema de backup e restauração

## 🚀 Instalação Rápida

### 1. Instalação Automática
```bash
cd /caminho/para/o/projeto
./instalar.sh
```

### 2. Ou Instalação Manual
```bash
cd /caminho/para/o/projeto
npm install
node server.js
```

## 🎮 Como Usar

### 1. Acessar o Sistema
- **Interface Principal**: http://localhost:3000/final.html
- **Debug Avançado**: http://localhost:3000/debug.html
- **Testes**: 
  - http://localhost:3000/teste-simples.html
  - http://localhost:3000/teste-overlay.html

### 2. Monitorar o Sistema
```bash
./monitor-sistema.sh           # Verificação única
./monitor-sistema.sh -c        # Monitoramento contínuo
./monitor-sistema.sh -l        # Ver logs
```

### 3. Verificar Câmera
```bash
./test-camera.sh
```

### 4. Fazer Backup
```bash
./backup-projeto.sh
```

## 📁 Estrutura do Projeto

```
faceapi-webcam/
├── 🎯 INTERFACES
│   ├── final.html              # Interface principal otimizada
│   ├── debug.html              # Painel de debug avançado
│   ├── index.html              # Interface básica
│   └── teste-*.html            # Páginas de teste
├── 🖥️ SERVIDOR
│   ├── server.js               # Servidor Node.js + RTSP stream
│   └── package.json            # Dependências Node.js
├── 📜 SCRIPTS JS
│   ├── script-final.js         # Script principal otimizado
│   ├── script-simples.js       # Versão simples para teste
│   ├── script-overlay.js       # Versão com overlay separado
│   └── jsmpeg.min.js          # Biblioteca JSMpeg local
├── 🤖 MODELOS IA
│   └── models/                 # Modelos face-api.js
├── 🔧 FERRAMENTAS
│   ├── instalar.sh            # Instalação automática
│   ├── monitor-sistema.sh     # Monitoramento contínuo
│   ├── backup-projeto.sh      # Backup automático
│   └── test-camera.sh         # Teste da câmera
└── 📝 DOCUMENTAÇÃO
    └── README.md              # Este arquivo
```

## 🛠️ Scripts de Administração

### 📦 Instalação
```bash
./instalar.sh                 # Instalação completa automática
```

### 📊 Monitoramento
```bash
./monitor-sistema.sh          # Verificação única
./monitor-sistema.sh -c       # Monitoramento contínuo
./monitor-sistema.sh -l       # Exibir logs
./monitor-sistema.sh -h       # Ajuda
```

### 💾 Backup
```bash
./backup-projeto.sh           # Criar backup completo
# Backups ficam em: ~/backups/faceapi-webcam/
```

### 🔍 Teste de Câmera
```bash
./test-camera.sh              # Teste completo da câmera
```

## 🔧 Configuração da Câmera

**Câmera**: iME 360 C  
**IP Atual**: 192.168.1.24  
**URL RTSP**: `rtsp://admin:APPIA-DADOOH@192.168.1.24:554/cam/realmonitor?channel=1&subtype=1`

### Alterar IP da Câmera
Se o IP da câmera mudar, editar em `server.js`:
```javascript
streamUrl: 'rtsp://admin:APPIA-DADOOH@SEU_NOVO_IP:554/cam/realmonitor?channel=1&subtype=1'
```

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express
- **Stream**: node-rtsp-stream + FFmpeg
- **Frontend**: HTML5 + JavaScript
- **Vídeo**: JSMpeg (MPEG-1 via WebSocket)
- **IA**: face-api.js (TinyFaceDetector)
- **Canvas**: Overlay separado para detecções

## 📊 Especificações Técnicas

- **Resolução**: 640x480 pixels
- **FPS**: ~15 frames por segundo
- **Codec**: H.264 → MPEG-1 (conversão via FFmpeg)
- **Latência**: ~2-3 segundos
- **Threshold IA**: 0.3 (30% confiança mínima)
- **Entrada**: 416x416 (otimizado para TinyFaceDetector)
- **Porta Servidor**: 3000
- **Porta WebSocket**: 9999

## 🐛 Debug e Diagnóstico

### 🖥️ Interface de Debug
Acesse `http://localhost:3000/debug.html` para:
- Monitor de sistema em tempo real
- Logs detalhados de todas as operações
- Estatísticas de performance
- Status da câmera e conectividade
- Controles de debug avançados

### 📱 Console do Navegador
```javascript
// Verificar status do sistema
debugInfo()

// Variáveis globais disponíveis
systemState    // Estado completo do sistema
debugPlayer    // Player JSMpeg
debugCanvas    // Canvas principal
```

### Logs Importantes
- ✅ **Verde**: Operações bem-sucedidas
- ⚠️ **Amarelo**: Avisos (canvas carregando, etc.)
- ❌ **Vermelho**: Erros críticos

### Problemas Comuns

**1. "videoCanvas is undefined"**
- ✅ **Resolvido**: Sistema agora cria canvas antes do player

**2. Vídeo não aparece**
- Verificar IP da câmera: `./test-camera.sh`
- Verificar logs do servidor: console onde rodou `node server.js`

**3. Detecção não funciona**
- Aguardar carregamento dos modelos (3-5 segundos)
- Verificar console do navegador para erros

**4. Performance baixa**
- Fechar outras abas do navegador
- Verificar se há outros processos pesados rodando

## 📈 Melhorias Implementadas

### v2.0 (Atual)
- ✅ Script otimizado com gerenciamento de estado
- ✅ Overlay separado para melhor performance
- ✅ Interface moderna e responsiva
- ✅ Sistema de debug avançado
- ✅ Logs estruturados e informativos
- ✅ Verificação automática de bibliotecas
- ✅ Tratamento robusto de erros

### v1.x (Anterior)
- ✅ Detecção facial básica
- ✅ Stream RTSP funcionando
- ✅ Correção de bugs críticos

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs no console do navegador
2. Executar `debugInfo()` no console
3. Acessar página de debug: http://localhost:3000/debug.html
4. Verificar conectividade da câmera: `./test-camera.sh`

## 🎯 Status do Sistema

- ✅ **Stream RTSP**: Funcionando (15 FPS)
- ✅ **WebSocket**: Ativo na porta 9999
- ✅ **Detecção Facial**: Operacional (TinyFaceDetector)
- ✅ **Interface**: Responsiva e otimizada
- ✅ **Debug**: Sistema completo implementado

---

**Última atualização**: 9 de julho de 2025  
**Versão**: 2.0 - Sistema Otimizado
