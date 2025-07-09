#!/bin/bash

# Script de monitoramento contínuo do sistema de detecção facial
# Verifica servidor, stream, conectividade e recursos

CAMERA_IP="192.168.1.24"
SERVER_PORT="3000"
LOG_FILE="monitor.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log com timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Função para verificar servidor
check_server() {
    if curl -s -f "http://localhost:$SERVER_PORT" > /dev/null; then
        echo -e "${GREEN}✅ Servidor HTTP OK${NC}"
        return 0
    else
        echo -e "${RED}❌ Servidor HTTP falhou${NC}"
        return 1
    fi
}

# Função para verificar processo Node.js
check_node_process() {
    if pgrep -f "node server.js" > /dev/null; then
        echo -e "${GREEN}✅ Processo Node.js ativo${NC}"
        return 0
    else
        echo -e "${RED}❌ Processo Node.js não encontrado${NC}"
        return 1
    fi
}

# Função para verificar conectividade da câmera
check_camera() {
    if ping -c 1 -W 2 "$CAMERA_IP" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Câmera acessível (ping)${NC}"
        if nc -z -w3 "$CAMERA_IP" 554 2>/dev/null; then
            echo -e "${GREEN}✅ Porta RTSP da câmera OK${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Porta RTSP não responde${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Câmera não acessível${NC}"
        return 1
    fi
}

# Função para verificar uso de recursos
check_resources() {
    local cpu_usage=$(top -bn1 | grep "node server.js" | awk '{print $9}' | head -1)
    local memory_usage=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $4}' | head -1)
    
    if [ ! -z "$cpu_usage" ] && [ ! -z "$memory_usage" ]; then
        echo -e "${BLUE}📊 CPU: ${cpu_usage}% | Memória: ${memory_usage}%${NC}"
        
        # Alertas de uso elevado
        if (( $(echo "$cpu_usage > 80" | bc -l) )); then
            echo -e "${YELLOW}⚠️  Alto uso de CPU detectado${NC}"
        fi
        
        if (( $(echo "$memory_usage > 50" | bc -l) )); then
            echo -e "${YELLOW}⚠️  Alto uso de memória detectado${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Não foi possível obter informações de recursos${NC}"
    fi
}

# Função para verificar logs de erro
check_error_logs() {
    if [ -f "server.log" ]; then
        local error_count=$(grep -i "error\|failed\|exception" server.log | wc -l)
        if [ "$error_count" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  $error_count erros encontrados nos logs${NC}"
        else
            echo -e "${GREEN}✅ Sem erros nos logs${NC}"
        fi
    fi
}

# Função principal de monitoramento
monitor_system() {
    echo -e "${BLUE}🔍 Monitoramento do Sistema - $(date)${NC}"
    echo "=============================================="
    
    log_message "Iniciando verificação do sistema"
    
    # Verificações principais
    check_node_process
    check_server
    check_camera
    check_resources
    check_error_logs
    
    echo "=============================================="
    echo ""
}

# Função para monitoramento contínuo
continuous_monitor() {
    echo -e "${BLUE}🚀 Iniciando monitoramento contínuo (Ctrl+C para parar)${NC}"
    log_message "Monitor contínuo iniciado"
    
    while true; do
        monitor_system
        sleep 30  # Verifica a cada 30 segundos
    done
}

# Função para exibir ajuda
show_help() {
    echo "Monitor do Sistema de Detecção Facial"
    echo ""
    echo "Uso: $0 [opção]"
    echo ""
    echo "Opções:"
    echo "  -c, --continuous    Monitoramento contínuo"
    echo "  -o, --once         Verificação única"
    echo "  -l, --logs         Exibir logs recentes"
    echo "  -h, --help         Exibir esta ajuda"
    echo ""
    echo "Sem opções: executa verificação única"
}

# Função para exibir logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}📋 Logs recentes:${NC}"
        tail -20 "$LOG_FILE"
    else
        echo -e "${YELLOW}⚠️  Arquivo de log não encontrado${NC}"
    fi
}

# Processamento de argumentos
case "${1:-}" in
    -c|--continuous)
        continuous_monitor
        ;;
    -o|--once)
        monitor_system
        ;;
    -l|--logs)
        show_logs
        ;;
    -h|--help)
        show_help
        ;;
    "")
        monitor_system
        ;;
    *)
        echo -e "${RED}Opção inválida: $1${NC}"
        show_help
        exit 1
        ;;
esac
