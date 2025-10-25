# ITIV - Sistema de Gestão

Sistema web moderno desenvolvido com Next.js 14, Prisma, TypeScript e Tailwind CSS, com tema liquid glass e cores personalizadas.

## 🎨 Cores Principais

- **Vermelho**: `#ec212a`
- **Verde**: `#8bc03d`
- **Laranja**: `#f68423`
- **Roxo**: `#7c3a96`

## 🚀 Tecnologias

- **Next.js 14** - App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização com tema liquid glass
- **Prisma** - ORM para banco de dados
- **NextAuth.js** - Autenticação
- **SQLite** - Banco de dados (desenvolvimento)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar Prisma
npx prisma generate
npx prisma db push

# Executar em desenvolvimento
npm run dev
```

O sistema estará disponível em: `http://localhost:3000`

## 🔐 Credenciais de Teste

- **Usuário**: `admin`
- **Senha**: `admin123`

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/auth/[...nextauth]/  # Configuração NextAuth
│   ├── dashboard/               # Dashboard principal
│   ├── login/                   # Página de login
│   ├── layout.tsx               # Layout raiz
│   └── page.tsx                 # Página inicial
├── components/
│   └── Providers.tsx            # Providers do app
├── lib/
│   └── prisma.ts                # Cliente Prisma
└── types/
    └── next-auth.d.ts           # Types NextAuth

prisma/
└── schema.prisma                # Schema do banco

```

## 🎨 Tema Liquid Glass

O sistema utiliza um tema moderno com efeitos de glassmorphism:

- Efeitos de blur e transparência
- Animações suaves
- Gradientes com as cores principais
- Elementos flutuantes
- Responsivo para todos os dispositivos

## 🔧 Configuração do Banco de Dados

O sistema está configurado para usar SQLite em desenvolvimento. Para produção, basta alterar a `DATABASE_URL` no arquivo `.env.local` para seu banco de dados PostgreSQL, MySQL, etc.

## 📝 Próximos Passos

1. Adicionar logo.png na pasta `public/`
2. Implementar conexão real com banco de dados
3. Criar módulos específicos do sistema
4. Adicionar mais funcionalidades ao dashboard

## 🛡️ Segurança

- Autenticação JWT com NextAuth
- Variáveis de ambiente para credenciais
- Prepared para integração com banco real
- Middleware de proteção de rotas

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- Desktop
- Tablet
- Mobile
