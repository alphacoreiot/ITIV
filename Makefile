.PHONY: help start stop restart logs build status clean dev install shell db-shell

help: ## Mostra esta ajuda
	@echo "🐳 Sistema ITIV - Docker Manager (Linux)"
	@echo "=========================================="
	@echo ""
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Instalar dependências (primeira vez)
	@echo "📦 Instalando dependências..."
	@npm install
	@echo "✅ Dependências instaladas!"

start: ## Iniciar containers em produção
	@echo "▶️  Iniciando containers..."
	@docker-compose up -d
	@echo "✅ Sistema iniciado em http://localhost:3000"

dev: ## Iniciar em modo desenvolvimento (sem Docker)
	@echo "🚀 Iniciando modo desenvolvimento..."
	@npm run dev

stop: ## Parar containers
	@echo "⏹️  Parando containers..."
	@docker-compose down
	@echo "✅ Containers parados!"

restart: ## Reiniciar containers
	@echo "🔄 Reiniciando containers..."
	@docker-compose restart
	@echo "✅ Sistema reiniciado!"

logs: ## Ver logs em tempo real
	@echo "📋 Exibindo logs (Ctrl+C para sair)..."
	@docker-compose logs -f

logs-app: ## Ver apenas logs da aplicação
	@docker-compose logs -f app

logs-db: ## Ver apenas logs do banco
	@docker-compose logs -f postgres

build: ## Rebuild e iniciar containers
	@echo "🔨 Reconstruindo imagens..."
	@docker-compose up -d --build
	@echo "✅ Build concluído!"

status: ## Ver status dos containers
	@echo "📊 Status dos containers:"
	@docker-compose ps
	@echo ""
	@docker stats --no-stream

shell: ## Acessar shell do container da aplicação
	@docker exec -it itiv-dashboard sh

db-shell: ## Acessar shell do PostgreSQL
	@docker exec -it itiv-postgres psql -U postgres -d metabase

clean: ## Limpar tudo (containers, volumes, imagens)
	@echo "🧹 Limpando containers, volumes e imagens..."
	@docker-compose down -v --rmi all
	@echo "✅ Limpeza concluída!"

prune: ## Limpar recursos não utilizados do Docker
	@echo "🧹 Limpando recursos não utilizados..."
	@docker system prune -f
	@echo "✅ Prune concluído!"

.DEFAULT_GOAL := help

