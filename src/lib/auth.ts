import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                username: { label: "ユーザー名", type: "text" },
                password: { label: "パスワード", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username as string }
                })

                if (!user) {
                    return null
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                )

                if (!passwordMatch) {
                    return null
                }

                return {
                    id: String(user.id),
                    name: user.fullName,
                    email: user.email,
                    role: user.role
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 60, // 30分
    },
})

