// Force Node.js runtime for database and crypto operations
export const runtime = 'nodejs'

import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { validateSSOLogin, logAccess } from "@/lib/sso"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Validar login via SSO
          const user = await validateSSOLogin(
            credentials.username,
            credentials.password
          )

          if (!user) {
            // Registrar tentativa de login falha
            await logAccess(
              'unknown',
              'LOGIN',
              req?.headers?.['x-forwarded-for'] as string || 
              req?.headers?.['x-real-ip'] as string || 
              'unknown',
              req?.headers?.['user-agent'] || 'unknown',
              false,
              undefined,
              { email: credentials.username, erro: 'Credenciais inválidas' }
            )
            return null
          }

          // Registrar login bem-sucedido
          await logAccess(
            user.id,
            'LOGIN',
            req?.headers?.['x-forwarded-for'] as string || 
            req?.headers?.['x-real-ip'] as string || 
            'unknown',
            req?.headers?.['user-agent'] || 'unknown',
            true
          )

          return {
            id: user.id,
            name: user.nome,
            email: user.email,
            image: user.foto_url,
            // Dados extras do SSO
            cpf: user.cpf,
            cargo: user.cargo,
            departamento: user.departamento,
          }
        } catch (error) {
          console.error('[Auth] Erro ao autenticar:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.cpf = user.cpf
        token.cargo = user.cargo
        token.departamento = user.departamento
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.cpf = token.cpf as string
        session.user.cargo = token.cargo as string
        session.user.departamento = token.departamento as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

