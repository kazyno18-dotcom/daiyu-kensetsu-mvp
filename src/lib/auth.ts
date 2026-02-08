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
                try {
                    if (!credentials?.username || !credentials?.password) {
                        console.log("Missing credentials")
                        return null
                    }

                    const user = await prisma.user.findUnique({
                        where: { username: credentials.username as string }
                    })

                    if (!user) {
                        console.log("User not found:", credentials.username)
                        return null
                    }

                    const passwordMatch = await bcrypt.compare(
                        credentials.password as string,
                        user.passwordHash
                    )

                    if (!passwordMatch) {
                        console.log("Password mismatch for user:", credentials.username)
                        return null
                    }

                    console.log("Login successful for user:", user.username)
                    return {
                        id: String(user.id),
                        name: user.fullName,
                        email: user.email,
                        role: user.role
                    }
                } catch (error) {
                    console.error("Auth error:", error)
                    return null
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
        error: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 60, // 30分
    },
    debug: process.env.NODE_ENV === 'development',
})
