export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 開発用: ユーザー作成API
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { username, password, fullName, email, role } = data;

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                passwordHash,
                fullName,
                email,
                role: role || "worker",
            },
        });

        return NextResponse.json({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
