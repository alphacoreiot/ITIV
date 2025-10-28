# 🏛️ Sistema ITIV - Dashboard Tributário de Camaçari

Sistema de análise tributária com chatbot inteligente para consultas de IPTU, REFIS e TFF.

## 🚀 Instalação Rápida (Linux)

### Pré-requisitos

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose make git -y

# CentOS/RHEL/Rocky
sudo yum install docker docker-compose make git -y
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Instalar e Executar

```bash
# 1. Clonar repositório
git clone https://github.com/alphacoreiot/ITIV.git
cd ITIV

# 2. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Edite as credenciais do banco

# 3. Iniciar aplicação
make start
# ou
./docker.sh start

# 4. Acessar
# http://localhost:3000
```

## 📖 Documentação Completa

Veja [DOCKER.md](./DOCKER.md) para documentação detalhada sobre:
- Instalação em diferentes distribuições Linux
- Todos os comandos disponíveis
- Troubleshooting
- Deploy em produção
- Configuração de Nginx e SSL
- Monitoramento e manutenção

## 🎯 Comandos Principais

### Usando Make

```bash
make help       # Ver todos os comandos
make start      # Iniciar containers
make stop       # Parar containers
make logs       # Ver logs
make status     # Ver status
make build      # Rebuild
make clean      # Limpar tudo
```

### Usando Script Bash

```bash
chmod +x docker.sh
./docker.sh start    # Iniciar
./docker.sh logs     # Ver logs
./docker.sh stop     # Parar
./docker.sh help     # Ver ajuda
```

### Docker Compose Direto

```bash
docker-compose up -d --build    # Iniciar
docker-compose logs -f          # Logs
docker-compose down             # Parar
```

## 🏗️ Arquitetura

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Node.js 20 + TypeScript
- **Database**: PostgreSQL 15
- **Containerização**: Docker + Docker Compose
- **Chatbot**: Sistema determinístico com agentes especializados

## 🤖 Chatbot

Sistema de navegação por menu com 3 agentes especializados:

### 1️⃣ IPTU (Imposto Predial + COSIP + TRSD)
- Resumo geral 2025
- Arrecadação por bairro
- Histórico 2020-2025
- Maiores pagadores
- Maiores devedores
- Comparativo 2024 x 2025

### 2️⃣ REFIS 2025
- Resumo geral
- Situação dos acordos
- Distribuição de parcelas
- Top contribuintes
- Status financeiro
- Pessoa Física vs Jurídica

### 3️⃣ TFF (Taxa de Fiscalização de Funcionamento)
- Resumo geral
- Comparativo 2024 x 2025
- Análise por tipo de pessoa
- Análise por segmento econômico
- Maiores contribuintes
- Inadimplentes
- Status STM

## 📊 Funcionalidades

- **Dashboard Interativo**: Visualização de dados tributários em tempo real
- **Clima e Cotações**: Informações contextuais da região
- **Notícias**: Feed RSS integrado
- **Chatbot Tributário**: Consultas determinísticas com navegação numérica
- **Queries Otimizadas**: Consultas SQL pré-compiladas para performance
- **Formatação Inteligente**: Moeda, números e datas no padrão brasileiro

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
DATABASE_HOST=10.0.20.61
DATABASE_PORT=5432
DATABASE_NAME=metabase
DATABASE_USER=postgres
DATABASE_PASSWORD=sua_senha
NODE_ENV=production
PORT=3000
```

## 🐳 Docker

### Estrutura de Containers

```
itiv-dashboard  → Aplicação Next.js (porta 3000)
itiv-postgres   → PostgreSQL 15 (porta 5432) [opcional]
```

### Healthchecks Automáticos

- Aplicação verifica porta 3000 a cada 30s
- Banco verifica pg_isready a cada 10s

## 🔍 Troubleshooting

### Porta 3000 em uso

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Logs detalhados

```bash
make logs          # Todos os serviços
make logs-app      # Apenas aplicação
make logs-db       # Apenas banco
```

### Reset completo

```bash
make clean
make build
```

## 🚀 Deploy em Produção

### 1. Preparar servidor

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configurar e iniciar

```bash
git clone https://github.com/alphacoreiot/ITIV.git
cd ITIV
cp .env.example .env
nano .env  # Configurar credenciais
make build
make start
```

### 3. Nginx (opcional)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## 🔐 Segurança

- Altere senhas padrão em produção
- Use variáveis de ambiente para credenciais
- Configure firewall (UFW)
- Habilite HTTPS em produção
- Mantenha Docker atualizado

## 📝 Manutenção

### Backup do banco

```bash
docker exec itiv-postgres pg_dump -U postgres metabase > backup_$(date +%Y%m%d).sql
```

### Atualizar aplicação

```bash
git pull
make build
```

### Monitorar recursos

```bash
make status
docker stats
```

## 🤝 Contribuindo

Este é um projeto interno da Prefeitura de Camaçari - BA.

## 📄 Licença

Proprietário - Prefeitura Municipal de Camaçari

## 📧 Suporte

Para suporte técnico, entre em contato com a equipe de TI da SEFAZ Camaçari.

---

**Desenvolvido para a Prefeitura de Camaçari - Bahia** 🏛️
