# 🔐 Guia de Integração com SSO SEFAZ Camaçari

Este documento descreve como integrar sua aplicação ao Sistema de Single Sign-On (SSO) da SEFAZ Camaçari.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Requisitos](#requisitos)
3. [Banco de Dados](#banco-de-dados)
4. [Cadastro da Aplicação](#cadastro-da-aplicação)
5. [Integração via API](#integração-via-api)
6. [Fluxo de Autenticação](#fluxo-de-autenticação)
7. [Verificação de Permissões](#verificação-de-permissões)
8. [Exemplos de Código](#exemplos-de-código)

---

## 🎯 Visão Geral

O SSO SEFAZ Camaçari é um sistema centralizado de autenticação e autorização que permite:

- **Autenticação única**: Usuários fazem login uma vez e acessam múltiplas aplicações
- **Gestão centralizada**: Controle de usuários, permissões e módulos em um único local
- **Auditoria completa**: Logs de todos os acessos e ações
- **Permissões granulares**: Controle por aplicação, módulo e tipo de permissão (READ, WRITE, DELETE, ADMIN)

---

## 📦 Requisitos

### Tecnologias Necessárias

- **Banco de Dados**: PostgreSQL 12+ (acesso ao banco do SSO)
- **Linguagem**: Qualquer (exemplos em Node.js, Python, PHP)
- **Bibliotecas**: Cliente HTTP para chamadas à API

### Informações Fornecidas pelo Administrador SSO

Após cadastrar sua aplicação no SSO, você receberá:

- ✅ **ID da Aplicação** (UUID)
- ✅ **Chave API** (token de autenticação)
- ✅ **URL do SSO**: `http://localhost:3000` (ou URL de produção)

---

## 🗄️ Banco de Dados

### Conexão

```env
DATABASE_URL=postgresql://usuario:senha@10.0.20.61:5432/metabase
```

### Tabelas Relevantes para Integração

#### 1. `sso_usuarios`
Tabela de usuários do sistema.

```sql
CREATE TABLE sso_usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- bcrypt hash
    ativo BOOLEAN DEFAULT true,
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    foto_url VARCHAR(500),
    created_at TIMESTAMP(6) DEFAULT NOW(),
    updated_at TIMESTAMP(6) DEFAULT NOW(),
    ultimo_acesso TIMESTAMP(6)
);
```

**Campos importantes:**
- `id`: Identificador único do usuário
- `email`: Email para login
- `ativo`: Se o usuário está ativo no sistema

---

#### 2. `sso_aplicacoes`
Tabela de aplicações cadastradas no SSO.

```sql
CREATE TABLE sso_aplicacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    url VARCHAR(500),
    chave_api VARCHAR(255) UNIQUE NOT NULL, -- Token de autenticação
    ativo BOOLEAN DEFAULT true,
    icone VARCHAR(255),
    cor VARCHAR(7), -- Hex color
    ordem INT DEFAULT 0,
    created_at TIMESTAMP(6) DEFAULT NOW(),
    updated_at TIMESTAMP(6) DEFAULT NOW()
);
```

**Campos importantes:**
- `id`: ID da sua aplicação (UUID)
- `chave_api`: Token para autenticar chamadas à API
- `ativo`: Se a aplicação está ativa

---

#### 3. `sso_modulos`
Módulos/funcionalidades dentro de uma aplicação.

```sql
CREATE TABLE sso_modulos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aplicacao_id UUID NOT NULL REFERENCES sso_aplicacoes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    rota VARCHAR(255), -- Ex: /dashboard, /relatorios
    ativo BOOLEAN DEFAULT true,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP(6) DEFAULT NOW(),
    updated_at TIMESTAMP(6) DEFAULT NOW()
);
```

**Exemplo de módulos:**
- Dashboard (`/dashboard`)
- Relatórios (`/relatorios`)
- Configurações (`/configuracoes`)

---

#### 4. `sso_permissoes`
Tipos de permissões disponíveis.

```sql
CREATE TABLE sso_permissoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL, -- READ, WRITE, DELETE, ADMIN
    descricao TEXT,
    created_at TIMESTAMP(6) DEFAULT NOW()
);
```

**Permissões padrão:**
- `READ`: Visualizar
- `WRITE`: Criar/Editar
- `DELETE`: Excluir
- `ADMIN`: Administração completa

---

#### 5. `sso_usuario_aplicacao`
Relacionamento usuário ↔ aplicação (acesso à aplicação).

```sql
CREATE TABLE sso_usuario_aplicacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES sso_usuarios(id) ON DELETE CASCADE,
    aplicacao_id UUID NOT NULL REFERENCES sso_aplicacoes(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    data_concessao TIMESTAMP(6) DEFAULT NOW(),
    data_expiracao TIMESTAMP(6), -- NULL = sem expiração
    concessor_id UUID REFERENCES sso_usuarios(id),
    created_at TIMESTAMP(6) DEFAULT NOW(),
    UNIQUE(usuario_id, aplicacao_id)
);
```

**Para verificar se usuário tem acesso à aplicação:**
```sql
SELECT * FROM sso_usuario_aplicacao 
WHERE usuario_id = 'user-uuid' 
  AND aplicacao_id = 'app-uuid'
  AND ativo = true
  AND (data_expiracao IS NULL OR data_expiracao >= NOW());
```

---

#### 6. `sso_usuario_modulo`
Permissões específicas do usuário em cada módulo.

```sql
CREATE TABLE sso_usuario_modulo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES sso_usuarios(id) ON DELETE CASCADE,
    modulo_id UUID NOT NULL REFERENCES sso_modulos(id) ON DELETE CASCADE,
    permissao_id UUID NOT NULL REFERENCES sso_permissoes(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    data_concessao TIMESTAMP(6) DEFAULT NOW(),
    data_expiracao TIMESTAMP(6),
    created_at TIMESTAMP(6) DEFAULT NOW(),
    UNIQUE(usuario_id, modulo_id, permissao_id)
);
```

**Para verificar permissões de um usuário em um módulo:**
```sql
SELECT p.codigo as permissao
FROM sso_usuario_modulo um
JOIN sso_permissoes p ON p.id = um.permissao_id
WHERE um.usuario_id = 'user-uuid'
  AND um.modulo_id = 'module-uuid'
  AND um.ativo = true
  AND (um.data_expiracao IS NULL OR um.data_expiracao >= NOW());
```

---

#### 7. `sso_logs_acesso`
Logs de acesso e ações (auditoria).

```sql
CREATE TABLE sso_logs_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES sso_usuarios(id) ON DELETE SET NULL,
    aplicacao_id UUID REFERENCES sso_aplicacoes(id) ON DELETE SET NULL,
    modulo_id UUID REFERENCES sso_modulos(id) ON DELETE SET NULL,
    acao VARCHAR(50) NOT NULL, -- LOGIN, LOGOUT, ACCESS, CREATE, UPDATE, DELETE
    ip VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP(6) DEFAULT NOW(),
    sucesso BOOLEAN DEFAULT true,
    detalhes JSONB
);
```

**Sua aplicação deve registrar logs:**
```sql
INSERT INTO sso_logs_acesso (usuario_id, aplicacao_id, modulo_id, acao, ip, sucesso, detalhes)
VALUES ('user-uuid', 'app-uuid', 'module-uuid', 'ACCESS', '192.168.1.1', true, '{"rota": "/dashboard"}');
```

---

## 🔧 Cadastro da Aplicação

### 1. Acesse o Painel SSO

```
URL: http://localhost:3000/dashboard/aplicacoes
```

### 2. Clique em "Nova Aplicação"

Preencha os dados:

```yaml
Nome: "Minha Aplicação"
Descrição: "Sistema de Gestão XYZ"
URL: "http://localhost:4000" (URL da sua aplicação)
Cor: "#0bb0ed" (cor para identificação visual)
Ícone: "📊" (opcional)
```

### 3. Guarde a Chave API

Após criar, você receberá uma **Chave API** (UUID). Guarde com segurança:

```env
SSO_APP_ID=ac86e8c4-32f6-4103-b544-12836864fc43
SSO_API_KEY=chave-api-unica-gerada-automaticamente
```

### 4. Cadastre os Módulos

Acesse: `Aplicações > [Sua App] > Módulos`

Exemplos:
```yaml
Módulo: Dashboard
Rota: /dashboard
Descrição: Página principal com estatísticas

Módulo: Relatórios
Rota: /relatorios
Descrição: Visualização e exportação de relatórios

Módulo: Configurações
Rota: /configuracoes
Descrição: Gerenciamento de configurações
```

---

## 🔌 Integração via API

### Base URL

```
http://localhost:3000/api
```

### Headers Obrigatórios

```http
Authorization: Bearer {SUA_CHAVE_API}
Content-Type: application/json
```

---

## 🔐 Fluxo de Autenticação

### Método 1: Redirecionamento para SSO (Recomendado)

#### 1. Usuário acessa sua aplicação

```javascript
// Verifica se usuário está autenticado
if (!session) {
  // Redireciona para o SSO com URL de retorno
  window.location.href = `http://localhost:3000/login?redirect=${encodeURIComponent(window.location.href)}`
}
```

#### 2. Usuário faz login no SSO

O SSO valida as credenciais e retorna com um token.

#### 3. SSO redireciona de volta

```
http://sua-aplicacao.com?token=jwt-token-aqui
```

#### 4. Sua aplicação valida o token

```javascript
// Endpoint de validação (criar na sua API)
POST /api/auth/validate
{
  "token": "jwt-token-recebido"
}

// Chama o SSO para validar
const response = await fetch('http://localhost:3000/api/auth/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SUA_CHAVE_API'
  },
  body: JSON.stringify({ token })
})

const userData = await response.json()
// { id, email, nome, cpf }
```

---

### Método 2: Consulta Direta ao Banco (Para Aplicações na Mesma Rede)

```javascript
// Exemplo com Prisma (Node.js)
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://usuario:senha@10.0.20.61:5432/metabase'
    }
  }
})

// Validar login
async function validarLogin(email, senha) {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: {
      usuarioAplicacoes: {
        where: {
          aplicacaoId: 'SEU_APP_ID',
          ativo: true,
          OR: [
            { dataExpiracao: null },
            { dataExpiracao: { gte: new Date() } }
          ]
        }
      }
    }
  })

  if (!usuario || !usuario.ativo) {
    throw new Error('Usuário não encontrado ou inativo')
  }

  // Verificar se tem acesso à aplicação
  if (usuario.usuarioAplicacoes.length === 0) {
    throw new Error('Usuário sem acesso a esta aplicação')
  }

  // Validar senha (bcrypt)
  const bcrypt = require('bcrypt')
  const senhaValida = await bcrypt.compare(senha, usuario.senha)

  if (!senhaValida) {
    throw new Error('Senha inválida')
  }

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cpf: usuario.cpf
  }
}
```

---

## 🛡️ Verificação de Permissões

### Verificar Acesso à Aplicação

```javascript
async function temAcessoAplicacao(usuarioId, aplicacaoId) {
  const acesso = await prisma.usuarioAplicacao.findFirst({
    where: {
      usuarioId,
      aplicacaoId,
      ativo: true,
      OR: [
        { dataExpiracao: null },
        { dataExpiracao: { gte: new Date() } }
      ]
    }
  })

  return !!acesso
}
```

### Verificar Permissões em Módulo

```javascript
async function obterPermissoesModulo(usuarioId, moduloId) {
  const permissoes = await prisma.usuarioModulo.findMany({
    where: {
      usuarioId,
      moduloId,
      ativo: true,
      OR: [
        { dataExpiracao: null },
        { dataExpiracao: { gte: new Date() } }
      ]
    },
    include: {
      permissao: true
    }
  })

  return permissoes.map(p => p.permissao.codigo)
  // Retorna: ['READ', 'WRITE', 'ADMIN']
}
```

### Middleware de Autorização (Express.js)

```javascript
// middleware/checkPermission.js
async function checkPermission(requiredPermission) {
  return async (req, res, next) => {
    const { userId } = req.session
    const moduloId = 'UUID_DO_MODULO'

    const permissoes = await obterPermissoesModulo(userId, moduloId)

    if (!permissoes.includes(requiredPermission) && !permissoes.includes('ADMIN')) {
      return res.status(403).json({ error: 'Sem permissão' })
    }

    next()
  }
}

// Uso nas rotas
app.get('/api/relatorios', checkPermission('READ'), async (req, res) => {
  // Só executa se usuário tiver permissão READ ou ADMIN
})

app.post('/api/relatorios', checkPermission('WRITE'), async (req, res) => {
  // Só executa se usuário tiver permissão WRITE ou ADMIN
})

app.delete('/api/relatorios/:id', checkPermission('DELETE'), async (req, res) => {
  // Só executa se usuário tiver permissão DELETE ou ADMIN
})
```

---

## 📝 Registrar Logs de Acesso

```javascript
async function registrarLog(usuarioId, aplicacaoId, moduloId, acao, ip, sucesso = true, detalhes = {}) {
  await prisma.logAcesso.create({
    data: {
      usuarioId,
      aplicacaoId,
      moduloId,
      acao, // LOGIN, ACCESS, CREATE, UPDATE, DELETE
      ip,
      userAgent: req.headers['user-agent'],
      sucesso,
      detalhes: detalhes // JSON com informações extras
    }
  })
}

// Exemplo de uso
app.post('/api/relatorios', async (req, res) => {
  try {
    const relatorio = await criarRelatorio(req.body)

    // Registrar log de sucesso
    await registrarLog(
      req.session.userId,
      'SEU_APP_ID',
      'MODULO_RELATORIOS_ID',
      'CREATE',
      req.ip,
      true,
      { relatorioId: relatorio.id, nome: relatorio.nome }
    )

    res.json(relatorio)
  } catch (error) {
    // Registrar log de erro
    await registrarLog(
      req.session.userId,
      'SEU_APP_ID',
      'MODULO_RELATORIOS_ID',
      'CREATE',
      req.ip,
      false,
      { erro: error.message }
    )

    res.status(500).json({ error: error.message })
  }
})
```

---

## 💡 Exemplos de Código

### Exemplo Completo: Python (Flask)

```python
from flask import Flask, request, jsonify, session, redirect
import psycopg2
import bcrypt
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'sua-chave-secreta'

# Conexão com banco
def get_db():
    return psycopg2.connect(
        host="10.0.20.61",
        database="metabase",
        user="usuario",
        password="senha"
    )

# Config da aplicação
APP_ID = 'ac86e8c4-32f6-4103-b544-12836864fc43'
SSO_URL = 'http://localhost:3000'

@app.route('/login', methods=['POST'])
def login():
    email = request.json.get('email')
    senha = request.json.get('senha')
    
    conn = get_db()
    cur = conn.cursor()
    
    # Buscar usuário
    cur.execute("""
        SELECT u.id, u.nome, u.email, u.senha, u.ativo
        FROM sso_usuarios u
        WHERE u.email = %s
    """, (email,))
    
    usuario = cur.fetchone()
    
    if not usuario or not usuario[4]:  # ativo = False
        return jsonify({'error': 'Usuário não encontrado ou inativo'}), 401
    
    # Verificar senha
    if not bcrypt.checkpw(senha.encode('utf-8'), usuario[3].encode('utf-8')):
        return jsonify({'error': 'Senha inválida'}), 401
    
    # Verificar acesso à aplicação
    cur.execute("""
        SELECT 1 FROM sso_usuario_aplicacao
        WHERE usuario_id = %s 
          AND aplicacao_id = %s
          AND ativo = true
          AND (data_expiracao IS NULL OR data_expiracao >= NOW())
    """, (usuario[0], APP_ID))
    
    if not cur.fetchone():
        return jsonify({'error': 'Sem acesso a esta aplicação'}), 403
    
    # Registrar log
    cur.execute("""
        INSERT INTO sso_logs_acesso 
        (usuario_id, aplicacao_id, acao, ip, user_agent, sucesso)
        VALUES (%s, %s, 'LOGIN', %s, %s, true)
    """, (usuario[0], APP_ID, request.remote_addr, request.headers.get('User-Agent')))
    
    conn.commit()
    cur.close()
    conn.close()
    
    # Criar sessão
    session['user_id'] = usuario[0]
    session['user_name'] = usuario[1]
    session['user_email'] = usuario[2]
    
    return jsonify({
        'id': usuario[0],
        'nome': usuario[1],
        'email': usuario[2]
    })

@app.route('/check-permission/<modulo_id>/<permissao>')
def check_permission(modulo_id, permissao):
    if 'user_id' not in session:
        return jsonify({'error': 'Não autenticado'}), 401
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT p.codigo
        FROM sso_usuario_modulo um
        JOIN sso_permissoes p ON p.id = um.permissao_id
        WHERE um.usuario_id = %s
          AND um.modulo_id = %s
          AND um.ativo = true
          AND (um.data_expiracao IS NULL OR um.data_expiracao >= NOW())
    """, (session['user_id'], modulo_id))
    
    permissoes = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    
    has_permission = permissao in permissoes or 'ADMIN' in permissoes
    
    return jsonify({
        'hasPermission': has_permission,
        'permissions': permissoes
    })

if __name__ == '__main__':
    app.run(port=4000)
```

---

### Exemplo Completo: PHP

```php
<?php
// config.php
define('DB_HOST', '10.0.20.61');
define('DB_NAME', 'metabase');
define('DB_USER', 'usuario');
define('DB_PASS', 'senha');
define('APP_ID', 'ac86e8c4-32f6-4103-b544-12836864fc43');

// Database connection
function getDB() {
    $dsn = "pgsql:host=" . DB_HOST . ";dbname=" . DB_NAME;
    return new PDO($dsn, DB_USER, DB_PASS);
}

// auth.php
session_start();

function login($email, $senha) {
    $db = getDB();
    
    // Buscar usuário
    $stmt = $db->prepare("
        SELECT u.id, u.nome, u.email, u.senha, u.ativo
        FROM sso_usuarios u
        WHERE u.email = :email
    ");
    $stmt->execute(['email' => $email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario || !$usuario['ativo']) {
        throw new Exception('Usuário não encontrado ou inativo');
    }
    
    // Verificar senha
    if (!password_verify($senha, $usuario['senha'])) {
        throw new Exception('Senha inválida');
    }
    
    // Verificar acesso à aplicação
    $stmt = $db->prepare("
        SELECT 1 FROM sso_usuario_aplicacao
        WHERE usuario_id = :user_id 
          AND aplicacao_id = :app_id
          AND ativo = true
          AND (data_expiracao IS NULL OR data_expiracao >= NOW())
    ");
    $stmt->execute([
        'user_id' => $usuario['id'],
        'app_id' => APP_ID
    ]);
    
    if (!$stmt->fetch()) {
        throw new Exception('Sem acesso a esta aplicação');
    }
    
    // Registrar log
    $stmt = $db->prepare("
        INSERT INTO sso_logs_acesso 
        (usuario_id, aplicacao_id, acao, ip, user_agent, sucesso)
        VALUES (:user_id, :app_id, 'LOGIN', :ip, :user_agent, true)
    ");
    $stmt->execute([
        'user_id' => $usuario['id'],
        'app_id' => APP_ID,
        'ip' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT']
    ]);
    
    // Criar sessão
    $_SESSION['user_id'] = $usuario['id'];
    $_SESSION['user_name'] = $usuario['nome'];
    $_SESSION['user_email'] = $usuario['email'];
    
    return [
        'id' => $usuario['id'],
        'nome' => $usuario['nome'],
        'email' => $usuario['email']
    ];
}

function checkPermission($moduloId, $permissao) {
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    
    $db = getDB();
    $stmt = $db->prepare("
        SELECT p.codigo
        FROM sso_usuario_modulo um
        JOIN sso_permissoes p ON p.id = um.permissao_id
        WHERE um.usuario_id = :user_id
          AND um.modulo_id = :modulo_id
          AND um.ativo = true
          AND (um.data_expiracao IS NULL OR um.data_expiracao >= NOW())
    ");
    $stmt->execute([
        'user_id' => $_SESSION['user_id'],
        'modulo_id' => $moduloId
    ]);
    
    $permissoes = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    return in_array($permissao, $permissoes) || in_array('ADMIN', $permissoes);
}

// Exemplo de uso
try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_GET['action'] === 'login') {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = login($data['email'], $data['senha']);
        
        header('Content-Type: application/json');
        echo json_encode($result);
    }
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
```

---

## 🎯 Checklist de Integração

- [ ] Aplicação cadastrada no SSO
- [ ] Chave API guardada com segurança
- [ ] Módulos cadastrados
- [ ] Conexão com banco de dados SSO configurada
- [ ] Fluxo de autenticação implementado
- [ ] Verificação de acesso à aplicação
- [ ] Verificação de permissões por módulo
- [ ] Registro de logs implementado
- [ ] Middleware de autorização nas rotas
- [ ] Tratamento de expiração de permissões
- [ ] Atualização de `ultimo_acesso` do usuário

---

## 🆘 Suporte

Para dúvidas ou problemas:

- **Documentação**: [INSTALL.md](./INSTALL.md)
- **Painel SSO**: http://localhost:3000
- **Contato**: Administrador SSO SEFAZ Camaçari

---

## 📊 Diagrama de Fluxo

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       ├──1. Acessa Aplicação
       │
       ▼
┌─────────────────┐
│  Sua Aplicação  │
└────────┬────────┘
         │
         ├──2. Não autenticado?
         │     Redireciona para SSO
         │
         ▼
┌─────────────────┐
│   SSO SEFAZ     │
│  (Login Page)   │
└────────┬────────┘
         │
         ├──3. Valida credenciais
         ├──4. Verifica acesso à aplicação
         ├──5. Gera token
         │
         ▼
┌─────────────────┐
│  Sua Aplicação  │
│  (com token)    │
└────────┬────────┘
         │
         ├──6. Valida token
         ├──7. Cria sessão
         ├──8. Verifica permissões
         ├──9. Registra log
         │
         ▼
┌─────────────────┐
│    Dashboard    │
│   (autenticado) │
└─────────────────┘
```

---

## 🔒 Boas Práticas de Segurança

1. **Nunca exponha a chave API no frontend**
2. **Use HTTPS em produção**
3. **Valide sempre as permissões no backend**
4. **Registre todos os acessos nos logs**
5. **Implemente rate limiting nas APIs**
6. **Verifique expiração de permissões**
7. **Use prepared statements para prevenir SQL injection**
8. **Mantenha as senhas hasheadas com bcrypt**

---

Desenvolvido por **SEFAZ Camaçari** 🏛️
