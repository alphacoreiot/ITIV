#!/bin/bash

# Script de gerenciamento do Sistema ITIV
# Uso: ./docker.sh [comando]

set -e

COLOR_CYAN='\033[0;36m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_CYAN}🐳 Sistema ITIV - Docker Manager${COLOR_RESET}"
echo -e "${COLOR_CYAN}===================================${COLOR_RESET}"
echo ""

command=${1:-help}

case "$command" in
    start)
        echo -e "${COLOR_GREEN}▶️  Iniciando containers...${COLOR_RESET}"
        docker-compose up -d
        echo ""
        echo -e "${COLOR_GREEN}✅ Sistema iniciado!${COLOR_RESET}"
        echo -e "${COLOR_YELLOW}🌐 Acesse: http://localhost:3000${COLOR_RESET}"
        ;;
    
    stop)
        echo -e "${COLOR_YELLOW}⏹️  Parando containers...${COLOR_RESET}"
        docker-compose down
        echo -e "${COLOR_GREEN}✅ Containers parados!${COLOR_RESET}"
        ;;
    
    restart)
        echo -e "${COLOR_YELLOW}🔄 Reiniciando containers...${COLOR_RESET}"
        docker-compose restart
        echo -e "${COLOR_GREEN}✅ Sistema reiniciado!${COLOR_RESET}"
        ;;
    
    logs)
        echo -e "${COLOR_CYAN}📋 Exibindo logs (Ctrl+C para sair)...${COLOR_RESET}"
        docker-compose logs -f
        ;;
    
    build)
        echo -e "${COLOR_CYAN}🔨 Reconstruindo imagens...${COLOR_RESET}"
        docker-compose up -d --build
        echo -e "${COLOR_GREEN}✅ Build concluído!${COLOR_RESET}"
        ;;
    
    status)
        echo -e "${COLOR_CYAN}📊 Status dos containers:${COLOR_RESET}"
        docker-compose ps
        echo ""
        docker stats --no-stream
        ;;
    
    shell)
        echo -e "${COLOR_CYAN}🐚 Acessando shell do container...${COLOR_RESET}"
        docker exec -it itiv-dashboard sh
        ;;
    
    db-shell)
        echo -e "${COLOR_CYAN}🗄️  Acessando PostgreSQL...${COLOR_RESET}"
        docker exec -it itiv-postgres psql -U postgres -d metabase
        ;;
    
    clean)
        echo -e "${COLOR_RED}🧹 Limpando containers, volumes e imagens...${COLOR_RESET}"
        read -p "Tem certeza? Isso vai remover TUDO (s/n): " confirm
        if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
            docker-compose down -v --rmi all
            echo -e "${COLOR_GREEN}✅ Limpeza concluída!${COLOR_RESET}"
        else
            echo -e "${COLOR_YELLOW}❌ Operação cancelada${COLOR_RESET}"
        fi
        ;;
    
    install)
        echo -e "${COLOR_CYAN}📦 Instalando dependências...${COLOR_RESET}"
        npm install
        echo -e "${COLOR_GREEN}✅ Dependências instaladas!${COLOR_RESET}"
        ;;
    
    dev)
        echo -e "${COLOR_CYAN}🚀 Iniciando modo desenvolvimento...${COLOR_RESET}"
        npm run dev
        ;;
    
    help|*)
        echo "Comandos disponíveis:"
        echo ""
        echo -e "  ${COLOR_CYAN}start${COLOR_RESET}      - Iniciar containers"
        echo -e "  ${COLOR_CYAN}stop${COLOR_RESET}       - Parar containers"
        echo -e "  ${COLOR_CYAN}restart${COLOR_RESET}    - Reiniciar containers"
        echo -e "  ${COLOR_CYAN}logs${COLOR_RESET}       - Ver logs em tempo real"
        echo -e "  ${COLOR_CYAN}build${COLOR_RESET}      - Rebuild containers"
        echo -e "  ${COLOR_CYAN}status${COLOR_RESET}     - Ver status e uso de recursos"
        echo -e "  ${COLOR_CYAN}shell${COLOR_RESET}      - Acessar shell do container"
        echo -e "  ${COLOR_CYAN}db-shell${COLOR_RESET}   - Acessar shell do PostgreSQL"
        echo -e "  ${COLOR_CYAN}clean${COLOR_RESET}      - Limpar tudo (containers, volumes, imagens)"
        echo -e "  ${COLOR_CYAN}install${COLOR_RESET}    - Instalar dependências npm"
        echo -e "  ${COLOR_CYAN}dev${COLOR_RESET}        - Modo desenvolvimento (sem Docker)"
        echo -e "  ${COLOR_CYAN}help${COLOR_RESET}       - Mostrar esta ajuda"
        echo ""
        echo "Uso: ./docker.sh [comando]"
        ;;
esac
