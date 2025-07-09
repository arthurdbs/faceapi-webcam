#!/bin/bash

# Script de instalação automática do Sistema de Detecção Facial
# Configura dependências, ambiente e testa o sistema

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="Sistema de Detecção Facial com RTSP"
NODE_MIN_VERSION="14"

echo -e "${BLUE}🚀 Instalação do $PROJECT_NAME${NC}"
echo "=================================================="

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para comparar versões
version_gt() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# Verificar Node.js
echo -e "${BLUE}🔍 Verificando Node.js...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    echo "✅ Node.js encontrado: v$NODE_VERSION"
    
    if version_gt "$NODE_MIN_VERSION.0.0" "$NODE_VERSION"; then
        echo -e "${YELLOW}⚠️  Versão do Node.js é antiga (mínimo: v$NODE_MIN_VERSION)${NC}"
        echo "📦 Considere atualizar o Node.js"
    fi
else
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    echo "📦 Instalando Node.js..."
    
    if command_exists apt; then
        sudo apt update
        sudo apt install -y nodejs npm
    elif command_exists yum; then
        sudo yum install -y nodejs npm
    elif command_exists pacman; then
        sudo pacman -S nodejs npm
    else
        echo -e "${RED}❌ Gerenciador de pacotes não suportado${NC}"
        echo "Por favor, instale o Node.js manualmente: https://nodejs.org"
        exit 1
    fi
fi

# Verificar npm
echo -e "${BLUE}🔍 Verificando npm...${NC}"
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm encontrado: v$NPM_VERSION"
else
    echo -e "${RED}❌ npm não encontrado${NC}"
    exit 1
fi

# Verificar FFmpeg
echo -e "${BLUE}🔍 Verificando FFmpeg...${NC}"
if command_exists ffmpeg; then
    echo "✅ FFmpeg encontrado"
else
    echo -e "${YELLOW}⚠️  FFmpeg não encontrado${NC}"
    echo "📦 Instalando FFmpeg..."
    
    if command_exists apt; then
        sudo apt install -y ffmpeg
    elif command_exists yum; then
        sudo yum install -y ffmpeg
    elif command_exists pacman; then
        sudo pacman -S ffmpeg
    else
        echo -e "${YELLOW}⚠️  Instale o FFmpeg manualmente se necessário${NC}"
    fi
fi

# Instalar dependências do projeto
echo -e "${BLUE}📦 Instalando dependências do projeto...${NC}"
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependências instaladas com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao instalar dependências${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ package.json não encontrado${NC}"
    exit 1
fi

# Verificar modelos face-api.js
echo -e "${BLUE}🔍 Verificando modelos face-api.js...${NC}"
if [ -d "models" ] && [ "$(ls -A models)" ]; then
    echo "✅ Modelos encontrados"
    echo "📄 Modelos disponíveis:"
    ls -la models/ | grep -E "\.(json|bin|weights)$" | awk '{print "   " $9}'
else
    echo -e "${YELLOW}⚠️  Modelos não encontrados ou diretório vazio${NC}"
    echo "📥 Os modelos face-api.js devem estar no diretório 'models/'"
fi

# Configurar IP da câmera
echo -e "${BLUE}📹 Configuração da câmera...${NC}"
echo "Por favor, informe o IP da sua câmera RTSP:"
read -p "IP da câmera (exemplo: 192.168.1.24): " CAMERA_IP

if [ ! -z "$CAMERA_IP" ]; then
    # Atualizar IP no server.js
    if [ -f "server.js" ]; then
        sed -i "s/192\.168\.1\.[0-9]\+/$CAMERA_IP/g" server.js
        echo "✅ IP da câmera atualizado para: $CAMERA_IP"
    fi
    
    # Testar conectividade
    echo "🔍 Testando conectividade com a câmera..."
    if ping -c 1 -W 3 "$CAMERA_IP" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Câmera acessível${NC}"
        
        # Testar porta RTSP
        if command_exists nc; then
            if nc -z -w3 "$CAMERA_IP" 554 2>/dev/null; then
                echo -e "${GREEN}✅ Porta RTSP (554) acessível${NC}"
            else
                echo -e "${YELLOW}⚠️  Porta RTSP não responde${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Câmera não responde ao ping${NC}"
        echo "Verifique se o IP está correto e a câmera está ligada"
    fi
else
    echo "⏭️  Configuração de IP ignorada"
fi

# Criar diretórios necessários
echo -e "${BLUE}📁 Criando estrutura de diretórios...${NC}"
mkdir -p logs backups
echo "✅ Diretórios criados"

# Tornar scripts executáveis
echo -e "${BLUE}🔧 Configurando permissões...${NC}"
chmod +x *.sh 2>/dev/null
echo "✅ Scripts tornados executáveis"

# Teste final
echo -e "${BLUE}🧪 Executando teste do sistema...${NC}"
echo "Iniciando servidor para teste..."

# Iniciar servidor em background para teste
node server.js &
SERVER_PID=$!
sleep 3

# Testar servidor
if curl -s -f "http://localhost:3000" >/dev/null; then
    echo -e "${GREEN}✅ Servidor funcionando corretamente${NC}"
    
    # Parar servidor de teste
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    
    echo ""
    echo -e "${GREEN}🎉 Instalação concluída com sucesso!${NC}"
    echo "=================================================="
    echo ""
    echo -e "${BLUE}📋 Próximos passos:${NC}"
    echo "1. Para iniciar o sistema: node server.js"
    echo "2. Acesse no navegador: http://localhost:3000/final.html"
    echo "3. Para monitorar: ./monitor-sistema.sh"
    echo "4. Para backup: ./backup-projeto.sh"
    echo ""
    echo -e "${BLUE}📚 Arquivos importantes:${NC}"
    echo "• final.html - Interface principal"
    echo "• debug.html - Página de debug"
    echo "• server.js - Servidor principal"
    echo "• script-final.js - Script de detecção facial"
    echo ""
    echo -e "${BLUE}🔧 Configurações:${NC}"
    echo "• Porta do servidor: 3000"
    echo "• IP da câmera: $CAMERA_IP"
    echo "• Modelos face-api.js: ./models/"
    
else
    echo -e "${RED}❌ Erro ao testar servidor${NC}"
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    
    echo "Verifique os logs de erro e tente novamente"
    exit 1
fi
