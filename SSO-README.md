# 🔐 Integração SSO - Smart Sefaz

## ✅ Status da Integração

A aplicação **Smart Sefaz** está **totalmente integrada** ao sistema SSO SEFAZ Camaçari!

## 🎯 O que foi implementado

### 1. **Autenticação via SSO**
- ✅ Login validado contra tabela `sso_usuarios`
- ✅ Verificação de senha com bcrypt
- ✅ Verificação se usuário está ativo
- ✅ Verificação se usuário tem acesso à aplicação "Smart Sefaz"
- ✅ Registro de logs de login (sucesso e falha)
- ✅ Atualização de `ultimo_acesso` do usuário

### 2. **Controle de Permissões por Módulo**
- ✅ PermissionGuard component que verifica permissões client-side
- ✅ Verificação de acesso aos módulos:
  - `/dashboard` → Dashboard
  - `/bi-refis` → BI REFIS
  - `/bi-iptu` → BI IPTU
  - `/bi-tff` → BI TFF
  - `/bi-refis-percentuais` → BI REFIS Percentuais
- ✅ Suporte a permissões: READ, WRITE, DELETE, ADMIN
- ✅ Página de acesso negado automática
- ✅ Middleware NextAuth para proteção básica de rotas

### 3. **Auditoria Completa**
- ✅ Logs de LOGIN/LOGOUT
- ✅ Logs de acesso a cada módulo (ACTION = 'ACCESS')
- ✅ Registro de IP e User-Agent
- ✅ Detalhes em JSON para erros

### 4. **API de Permissões**
- ✅ Endpoint `/api/permissions` para consultar permissões do usuário
- ✅ Retorna lista de módulos e permissões

## 📋 Configuração

As configurações do SSO estão no arquivo `.env.local`:

```bash
SSO_APP_ID=ac86e8c4-32f6-4103-b544-12836864fc43
SSO_API_KEY=975d9179cecd100f7dee9df7b6c2fd4c35c33b7eed6abe1dcdc0fdd9a479a577
SSO_DB_HOST=10.0.20.61
SSO_DB_PORT=5432
SSO_DB_NAME=metabase
SSO_DB_USER=postgres
SSO_DB_PASS=CEnIg8shcyeF
```

## 👥 Como Gerenciar Usuários e Permissões

### 1. **Cadastrar Usuário no SSO**

No painel SSO (aplicação SSO separada):

1. Acesse `Usuários > Novo Usuário`
2. Preencha: nome, email, CPF, senha
3. Senha será automaticamente hasheada com bcrypt

### 2. **Dar Acesso à Aplicação Smart Sefaz**

1. Acesse `Usuários > [Usuário] > Aplicações`
2. Adicione a aplicação **Smart Sefaz**
3. Configure data de expiração (opcional)

### 3. **Configurar Permissões nos Módulos**

1. Acesse `Usuários > [Usuário] > Permissões`
2. Selecione o módulo (ex: Dashboard, BI REFIS)
3. Selecione as permissões:
   - **READ**: Visualizar
   - **WRITE**: Criar/Editar
   - **DELETE**: Excluir
   - **ADMIN**: Acesso total

## 🔧 Cadastrar Módulos no SSO

Atualmente existe apenas 1 módulo cadastrado. Você precisa cadastrar os outros:

### No Painel SSO:

1. Acesse `Aplicações > Smart Sefaz > Módulos`
2. Clique em "Novo Módulo"
3. Cadastre:

```yaml
Nome: Dashboard
Rota: /dashboard
Descrição: Painel principal com estatísticas e resumos

Nome: BI REFIS
Rota: /bi-refis
Descrição: Business Intelligence - Análise de REFIS

Nome: BI IPTU
Rota: /bi-iptu
Descrição: Business Intelligence - Análise de IPTU

Nome: BI TFF
Rota: /bi-tff
Descrição: Business Intelligence - Análise de TFF

Nome: BI REFIS Percentuais
Rota: /bi-refis-percentuais
Descrição: Análise de percentuais de entrada do REFIS
```

## 🧪 Testando a Integração

### 1. **Teste de Login**

```bash
# Login com usuário SSO
Email: usuario@sefaz.com
Senha: (senha cadastrada no SSO)
```

### 2. **Verificar Logs**

```sql
-- Logs de login
SELECT * FROM sso_logs_acesso
WHERE aplicacao_id = 'ac86e8c4-32f6-4103-b544-12836864fc43'
  AND acao = 'LOGIN'
ORDER BY timestamp DESC
LIMIT 10;

-- Logs de acesso a módulos
SELECT 
  u.nome as usuario,
  m.nome as modulo,
  l.acao,
  l.timestamp,
  l.ip
FROM sso_logs_acesso l
JOIN sso_usuarios u ON u.id = l.usuario_id
LEFT JOIN sso_modulos m ON m.id = l.modulo_id
WHERE l.aplicacao_id = 'ac86e8c4-32f6-4103-b544-12836864fc43'
ORDER BY l.timestamp DESC
LIMIT 20;
```

### 3. **Verificar Permissões**

```bash
# Após fazer login, consulte:
GET /api/permissions

# Resposta:
{
  "hasAccess": true,
  "modules": [
    {
      "id": "uuid",
      "nome": "Dashboard",
      "rota": "/dashboard",
      "permissions": ["READ", "WRITE", "ADMIN"]
    },
    ...
  ]
}
```

## 🚀 Fluxo de Autenticação

```
1. Usuário acessa /login
   ↓
2. Preenche email e senha
   ↓
3. NextAuth chama validateSSOLogin()
   ↓
4. Busca usuário em sso_usuarios
   ↓
5. Valida senha com bcrypt
   ↓
6. Verifica se está ativo
   ↓
7. Verifica acesso em sso_usuario_aplicacao
   ↓
8. Registra log de LOGIN
   ↓
9. Cria sessão JWT (8 horas)
   ↓
10. Redireciona para /dashboard
```

## 🔐 Fluxo de Permissões

```
1. Usuário acessa /bi-refis
   ↓
2. Middleware verifica autenticação
   ↓
3. Middleware consulta permissões em sso_usuario_modulo
   ↓
4. Se SEM permissão → Redireciona /dashboard?error=access_denied
   ↓
5. Se COM permissão → Registra log ACCESS e permite acesso
```

## 📊 Estrutura de Dados

### Usuário na Sessão

```typescript
{
  id: "uuid-do-usuario",
  name: "Nome Completo",
  email: "usuario@sefaz.com",
  cpf: "123.456.789-00",
  cargo: "Analista",
  departamento: "TI",
  image: "url-da-foto"
}
```

## 🛡️ Segurança

- ✅ Senhas hasheadas com bcrypt (nunca em texto puro)
- ✅ Sessões JWT com expiração de 8 horas
- ✅ Verificação de permissões no servidor (middleware)
- ✅ Logs de auditoria completos
- ✅ Proteção contra SQL injection (prepared statements)
- ✅ Validação de expiração de permissões

## 📝 Próximos Passos

1. ⏳ **Cadastrar os 5 módulos** no SSO (Dashboard, BI REFIS, BI IPTU, BI TFF, BI REFIS Percentuais)
2. ⏳ **Criar usuários** no SSO
3. ⏳ **Atribuir permissões** aos usuários nos módulos
4. ⏳ **Testar login** com usuários reais
5. ⏳ **Verificar logs** de acesso

## 🆘 Troubleshooting

### Erro: "Credenciais inválidas"
- Verifique se o email está correto
- Verifique se o usuário está ativo (`ativo = true`)
- Verifique se a senha foi cadastrada corretamente no SSO

### Erro: "Sem acesso a esta aplicação"
- Verifique se o usuário está vinculado à aplicação Smart Sefaz em `sso_usuario_aplicacao`
- Verifique se `ativo = true` e `data_expiracao` não está vencida

### Erro: "Access Denied"
- Verifique se o usuário tem permissões no módulo em `sso_usuario_modulo`
- Verifique se as permissões estão ativas
- Verifique se a data de expiração não está vencida

## 📞 Suporte

Para problemas com SSO, consulte:
- [INTEGRACAO.md](./INTEGRACAO.md) - Documentação completa do SSO
- Logs da aplicação no terminal
- Logs no banco: `SELECT * FROM sso_logs_acesso ORDER BY timestamp DESC LIMIT 50`

---

✅ **Integração SSO concluída com sucesso!**
