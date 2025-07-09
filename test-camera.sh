#!/bin/bash

echo "🔍 Testando conectividade da câmera..."
echo "============================================="

# Testar ping
echo "📡 Testando ping para 192.168.1.24..."
if ping -c 3 192.168.1.24 > /dev/null 2>&1; then
    echo "✅ Ping OK"
else
    echo "❌ Ping FALHOU"
fi

# Testar porta RTSP
echo "🔌 Testando porta RTSP (554)..."
if nc -z -v -w3 192.168.1.24 554 2>&1 | grep -q "succeeded"; then
    echo "✅ Porta 554 OK"
else
    echo "❌ Porta 554 FALHOU"
fi

# Testar com ffprobe
echo "📹 Testando stream RTSP..."
timeout 10 ffprobe -v quiet -print_format json -show_streams \
    "rtsp://admin:APPIA-DADOOH@192.168.1.24:554/cam/realmonitor?channel=1&subtype=1" \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Stream RTSP OK"
else
    echo "❌ Stream RTSP FALHOU"
fi

echo "============================================="
echo "🏁 Teste concluído"
