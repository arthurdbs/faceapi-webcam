#!/bin/bash

# Script de backup automático do projeto de detecção facial
# Cria backup completo incluindo configurações, scripts e logs

PROJECT_DIR="/home/arthurdbs/Área de Trabalho/Projetos/faceapi-webcam"
BACKUP_BASE_DIR="$HOME/backups/faceapi-webcam"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/backup_$TIMESTAMP"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📦 Criando backup do projeto de detecção facial${NC}"
echo "=================================================="

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Listar arquivos importantes para backup
IMPORTANT_FILES=(
    "server.js"
    "index.html"
    "script.js"
    "script-simples.js"
    "script-overlay.js"
    "script-final.js"
    "final.html"
    "debug.html"
    "teste-*.html"
    "package.json"
    "README.md"
    "jsmpeg.min.js"
    "test-camera.sh"
    "monitor-sistema.sh"
    "*.log"
    "models/"
    "images/"
)

echo -e "${BLUE}📋 Copiando arquivos importantes...${NC}"

# Copiar arquivos essenciais
for pattern in "${IMPORTANT_FILES[@]}"; do
    if ls "$PROJECT_DIR"/$pattern 1> /dev/null 2>&1; then
        cp -r "$PROJECT_DIR"/$pattern "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  Aviso: Não foi possível copiar $pattern"
        echo "✅ Copiado: $pattern"
    fi
done

# Criar arquivo de informações do backup
cat > "$BACKUP_DIR/backup_info.txt" << EOF
INFORMAÇÕES DO BACKUP
====================
Data: $(date)
Diretório original: $PROJECT_DIR
Backup criado em: $BACKUP_DIR

STATUS DO SISTEMA NO MOMENTO DO BACKUP:
======================================
EOF

# Adicionar status do sistema ao arquivo de informações
cd "$PROJECT_DIR"

echo "Processo Node.js:" >> "$BACKUP_DIR/backup_info.txt"
pgrep -f "node server.js" >> "$BACKUP_DIR/backup_info.txt" 2>/dev/null || echo "Não encontrado" >> "$BACKUP_DIR/backup_info.txt"

echo -e "\nPortas em uso:" >> "$BACKUP_DIR/backup_info.txt"
netstat -tlnp | grep ":3000\|:554" >> "$BACKUP_DIR/backup_info.txt" 2>/dev/null

echo -e "\nConectividade da câmera:" >> "$BACKUP_DIR/backup_info.txt"
ping -c 1 192.168.1.24 >> "$BACKUP_DIR/backup_info.txt" 2>&1

# Criar script de restauração
cat > "$BACKUP_DIR/restaurar.sh" << 'EOF'
#!/bin/bash

echo "🔄 Restaurando backup do projeto de detecção facial..."

# Verificar se o diretório de destino existe
DEST_DIR="/home/arthurdbs/Área de Trabalho/Projetos/faceapi-webcam"

if [ ! -d "$DEST_DIR" ]; then
    echo "📁 Criando diretório de destino..."
    mkdir -p "$DEST_DIR"
fi

# Copiar arquivos
echo "📋 Copiando arquivos..."
cp -r * "$DEST_DIR/" 2>/dev/null

# Tornar scripts executáveis
chmod +x "$DEST_DIR"/*.sh 2>/dev/null

echo "✅ Restauração concluída!"
echo "📂 Arquivos restaurados em: $DEST_DIR"
EOF

chmod +x "$BACKUP_DIR/restaurar.sh"

# Estatísticas do backup
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)

echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"
echo "📂 Local: $BACKUP_DIR"
echo "📊 Tamanho: $BACKUP_SIZE"
echo "📄 Arquivos: $FILE_COUNT"
echo ""
echo -e "${YELLOW}💡 Para restaurar este backup, execute:${NC}"
echo "   $BACKUP_DIR/restaurar.sh"

# Limpar backups antigos (manter apenas os 5 mais recentes)
echo -e "${BLUE}🧹 Limpando backups antigos...${NC}"
cd "$BACKUP_BASE_DIR" 2>/dev/null || exit 0

BACKUP_COUNT=$(ls -1d backup_* 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 5 ]; then
    BACKUPS_TO_REMOVE=$((BACKUP_COUNT - 5))
    ls -1dt backup_* | tail -$BACKUPS_TO_REMOVE | xargs rm -rf
    echo "🗑️  Removidos $BACKUPS_TO_REMOVE backups antigos"
fi

echo "🏁 Processo de backup finalizado!"
