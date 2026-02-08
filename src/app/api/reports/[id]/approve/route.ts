import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 承認/差し戻し
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 管理者またはマネージャーのみ
        if (session.user.role !== "admin" && session.user.role !== "manager") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const reportId = parseInt(id);
        const data = await request.json();
        const { action } = data; // 'approve' or 'reject'

        const report = await prisma.dailyReport.update({
            where: { id: reportId },
            data: {
                status: action === "approve" ? "approved" : "rejected",
                approvedById: parseInt(session.user.id),
                approvedAt: new Date(),
            },
        });

        return NextResponse.json(report);
    } catch (error) {
        console.error("Error approving report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
