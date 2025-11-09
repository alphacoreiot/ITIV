import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    cpf?: string
    cargo?: string
    departamento?: string
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      cpf?: string
      cargo?: string
      departamento?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    cpf?: string
    cargo?: string
    departamento?: string
  }
}
