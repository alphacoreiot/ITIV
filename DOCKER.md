# 🐳 Docker - Sistema ITIV (Linux)

Instruções para executar o Sistema de Análise Tributária de Camaçari usando Docker em ambiente Linux.

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Make (opcional, mas recomendado)

### Instalação no Ubuntu/Debian

```bash
# Atualizar repositórios
sudo apt update

# Instalar Docker
sudo apt install docker.io docker-compose make -y

# Adicionar usuário ao grupo docker (para não usar sudo)
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar
newgrp docker

# Verificar instalação
docker --version
docker-compose --version
```

### Instalação no CentOS/RHEL/Rocky Linux

```bash
# Instalar Docker
sudo yum install docker docker-compose make -y

# Iniciar serviço
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo
sudo usermod -aG docker $USER
newgrp docker
```

## 🚀 Início Rápido

### Usando Make (Recomendado)

```bash
# Ver todos os comandos disponíveis
make help

# Primeira vez: instalar dependências
make install

# Iniciar containers em produção
make start

# Ver logs em tempo real
make logs

# Parar containers
make stop
```

### Usando Docker Compose Diretamente

```bash
# Build e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## 🌐 Acesso

Aplicação: <http://localhost:3000>

## 🔧 Comandos Make Disponíveis

| Comando | Descrição |
|---------|-----------|
| `make help` | Mostra todos os comandos |
| `make install` | Instala dependências npm |
| `make start` | Inicia containers em produção |
| `make dev` | Inicia em modo desenvolvimento (sem Docker) |
| `make stop` | Para containers |
| `make restart` | Reinicia containers |
| `make logs` | Ver logs de todos os serviços |
| `make logs-app` | Ver apenas logs da aplicação |
| `make logs-db` | Ver apenas logs do banco |
| `make build` | Rebuild e reinicia containers |
| `make status` | Ver status e uso de recursos |
| `make shell` | Acessa shell do container da aplicação |
| `make db-shell` | Acessa shell do PostgreSQL |
| `make clean` | Remove tudo (containers, volumes, imagens) |
| `make prune` | Limpa recursos não utilizados do Docker |

## 📦 Estrutura dos Serviços

### App (Aplicação Next.js)

- **Porta**: 3000
- **Container**: `itiv-dashboard`
- **Tecnologia**: Node.js 20 + Next.js
- **Modo**: Production (standalone)

### PostgreSQL (Opcional)

- **Porta**: 5432
- **Container**: `itiv-postgres`
- **Banco**: metabase
- **Usuário**: postgres

## 🔧 Configuração

### Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite `.env` com suas configurações:

```bash
nano .env
# ou
vim .env
```

```env
DATABASE_HOST=10.0.20.61
DATABASE_PORT=5432
DATABASE_NAME=metabase
DATABASE_USER=postgres
DATABASE_PASSWORD=SUA_SENHA_AQUI
```

### Opções de Banco de Dados

#### Opção 1: Banco Externo (Padrão)

Conecta ao PostgreSQL em `10.0.20.61`:

```bash
# Iniciar apenas a aplicação
docker-compose up -d app
```

#### Opção 2: Banco Local (Container)

Usar container PostgreSQL local:

1. Altere `DATABASE_HOST` no `docker-compose.yml` ou `.env` para `postgres`
2. Inicie todos os serviços:

```bash
make start
# ou
docker-compose up -d
```

## � Troubleshooting

### Porta 3000 em uso

```bash
# Descobrir processo usando a porta
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>

# Ou altere a porta no docker-compose.yml
ports:
  - "3001:3000"
```

### Erro de conexão com banco

```bash
# Testar conectividade
make shell
nc -zv 10.0.20.61 5432

# Verificar logs
make logs-app
```

### Permissões do Docker

```bash
# Se precisar de sudo, adicione usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Reinicie o Docker daemon
sudo systemctl restart docker
```

### Rebuild completo

```bash
# Limpar tudo
make clean

# Limpar sistema Docker
make prune

# Rebuild
make build
```

### Logs detalhados

```bash
# Logs em tempo real
make logs

# Apenas aplicação
make logs-app

# Últimas 100 linhas
docker-compose logs --tail=100

# Seguir logs de um serviço específico
docker-compose logs -f app
```

## 🐚 Acessar Containers

### Shell da Aplicação

```bash
make shell
# ou
docker exec -it itiv-dashboard sh
```

### Shell do PostgreSQL

```bash
make db-shell
# ou
docker exec -it itiv-postgres psql -U postgres -d metabase
```

### Executar comandos no container

```bash
# Exemplo: verificar versão do Node
docker exec itiv-dashboard node --version

# Executar npm command
docker exec itiv-dashboard npm list
```

## 📊 Monitoramento

### Status dos containers

```bash
make status
```

### Uso de recursos em tempo real

```bash
docker stats
```

### Ver logs de healthcheck

```bash
docker inspect itiv-dashboard | grep -A 10 Health
```

## 🚀 Deploy em Servidor Linux

### 1. Preparar servidor

```bash
# Instalar Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clonar repositório

```bash
git clone https://github.com/alphacoreiot/ITIV.git
cd ITIV
```

### 3. Configurar e iniciar

```bash
# Copiar e editar variáveis
cp .env.example .env
nano .env

# Build e iniciar
make build
make start
```

### 4. Configurar Nginx (opcional)

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

### 5. Autostart com systemd

Criar `/etc/systemd/system/itiv.service`:

```ini
[Unit]
Description=ITIV Dashboard
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/caminho/para/ITIV
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=seu-usuario

[Install]
WantedBy=multi-user.target
```

Habilitar:

```bash
sudo systemctl enable itiv
sudo systemctl start itiv
```

## 🔐 Segurança em Produção

### 1. Alterar senhas padrão

```bash
# Editar .env com senhas fortes
nano .env
```

### 2. Usar Docker secrets (opcional)

```bash
echo "senha_segura" | docker secret create db_password -
```

### 3. Firewall

```bash
# Permitir apenas porta 3000
sudo ufw allow 3000/tcp
sudo ufw enable
```

### 4. HTTPS com Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com
```

## 💡 Dicas de Performance

### 1. Limitar recursos do container

Edite `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### 2. Usar cache de build

```bash
# Build com cache
docker-compose build --no-cache
```

### 3. Logs compactos

```bash
# Limitar tamanho dos logs
docker-compose logs --tail=50
```

## 📝 Manutenção

### Backup do banco (se usando container local)

```bash
docker exec itiv-postgres pg_dump -U postgres metabase > backup_$(date +%Y%m%d).sql
```

### Restaurar backup

```bash
docker exec -i itiv-postgres psql -U postgres metabase < backup_20250101.sql
```

### Atualizar aplicação

```bash
git pull
make build
```

---

**Sistema desenvolvido para a Prefeitura de Camaçari - BA**

