import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await auth();

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = Number(searchParams.get("limit")) || 20;
        const offset = Number(searchParams.get("offset")) || 0;

        const where = session.user.role === "worker"
            ? { createdById: Number(session.user.id) }
            : {};

        const [reports, total] = await Promise.all([
            prisma.dailyReport.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            fullName: true,
                        },
                    },
                },
                orderBy: {
                    reportDate: "desc",
                },
                take: limit,
                skip: offset,
            }),
            prisma.dailyReport.count({ where }),
        ]);

        return NextResponse.json({ reports, total });
    } catch (error) {
        console.error("[REPORTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
