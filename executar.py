#!/usr/bin/env python3
"""
Script universal para executar o contador de fluxo.
Funciona em Windows, Linux e macOS.
"""

import subprocess
import sys
import os
import platform

def main():
    print("=== CONTADOR DE FLUXO - INICIANDO ===")
    print()
    
    # Detecta o sistema operacional
    sistema = platform.system()
    
    # Define o caminho do Python baseado no sistema
    if sistema == "Windows":
        python_path = os.path.join(os.path.dirname(__file__), ".venv", "Scripts", "python.exe")
    else:  # Linux/macOS
        python_path = os.path.join(os.path.dirname(__file__), ".venv", "bin", "python")
    
    # Verifica se o ambiente virtual existe
    if not os.path.exists(python_path):
        print(f"ERRO: Ambiente virtual não encontrado em: {python_path}")
        print("Execute primeiro:")
        if sistema == "Windows":
            print("python -m venv .venv")
            print(".venv\\Scripts\\activate")
            print("pip install ultralytics opencv-python lap")
        else:
            print("python3 -m venv .venv")
            print("source .venv/bin/activate")
            print("pip install ultralytics opencv-python lap")
        return
    
    # Caminho do contador
    contador_path = os.path.join(os.path.dirname(__file__), "contador.py")
    
    if not os.path.exists(contador_path):
        print("ERRO: arquivo contador.py não encontrado!")
        return
    
    try:
        # Executa o contador
        subprocess.run([python_path, contador_path], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar: {e}")
    except KeyboardInterrupt:
        print("\nPrograma interrompido pelo usuário.")

if __name__ == "__main__":
    main()
