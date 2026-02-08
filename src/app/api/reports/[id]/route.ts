import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 日報詳細取得
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const reportId = parseInt(id);

        const report = await prisma.dailyReport.findUnique({
            where: { id: reportId },
            include: {
                createdBy: { select: { fullName: true, role: true } },
                approvedBy: { select: { fullName: true } },
                laborCosts: true,
                companyEquipment: true,
                materials: true,
                leasedEquipment: true,
                fuelCosts: true,
                subcontractors: true,
            },
        });

        if (!report) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // 作業員は自分の日報のみ閲覧可
        if (
            session.user.role === "worker" &&
            report.createdById !== parseInt(session.user.id)
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(report);
    } catch (error) {
        console.error("Error fetching report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 日報更新
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const reportId = parseInt(id);
        const data = await request.json();

        const existingReport = await prisma.dailyReport.findUnique({
            where: { id: reportId },
        });

        if (!existingReport) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // 作業員は自分の日報のみ編集可
        if (
            session.user.role === "worker" &&
            existingReport.createdById !== parseInt(session.user.id)
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 子テーブルを削除して再作成
        await prisma.$transaction([
            prisma.laborCost.deleteMany({ where: { reportId } }),
            prisma.companyEquipment.deleteMany({ where: { reportId } }),
            prisma.material.deleteMany({ where: { reportId } }),
            prisma.leasedEquipment.deleteMany({ where: { reportId } }),
            prisma.fuelCost.deleteMany({ where: { reportId } }),
            prisma.subcontractor.deleteMany({ where: { reportId } }),
        ]);

        const report = await prisma.dailyReport.update({
            where: { id: reportId },
            data: {
                reportDate: new Date(data.reportDate),
                dayOfWeek: data.dayOfWeek,
                weather: data.weather,
                reporterName: data.reporterName,
                projectName: data.projectName,
                workStartTime: data.workStartTime,
                workEndTime: data.workEndTime,
                absentWorkers: data.absentWorkers,
                repairContent: data.repairContent,
                cleanupContent: data.cleanupContent,
                workContent: data.workContent,
                status: data.status,
                laborCosts: {
                    create: data.laborCosts?.map(
                        (item: { workerName: string; hours: number; unitPrice: number; amount: number }) => ({
                            workerName: item.workerName,
                            hours: item.hours,
                            unitPrice: item.unitPrice,
                            amount: item.amount,
                        })
                    ),
                },
                companyEquipment: {
                    create: data.companyEquipment?.map(
                        (item: {
                            equipmentName: string;
                            hours: number;
                            unitPrice: number;
                            amount: number;
                        }) => ({
                            equipmentName: item.equipmentName,
                            hours: item.hours,
                            unitPrice: item.unitPrice,
                            amount: item.amount,
                        })
                    ),
                },
                materials: {
                    create: data.materials?.map(
                        (item: {
                            supplier: string;
                            materialName: string;
                            quantity: number;
                            unitPrice: number;
                            amount: number;
                        }) => ({
                            supplier: item.supplier,
                            materialName: item.materialName,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            amount: item.amount,
                        })
                    ),
                },
                leasedEquipment: {
                    create: data.leasedEquipment?.map(
                        (item: {
                            lender: string;
                            equipmentName: string;
                            hours: number;
                            unitPrice: number;
                            amount: number;
                        }) => ({
                            lender: item.lender,
                            equipmentName: item.equipmentName,
                            hours: item.hours,
                            unitPrice: item.unitPrice,
                            amount: item.amount,
                        })
                    ),
                },
                fuelCosts: {
                    create: data.fuelCosts?.map(
                        (item: {
                            productName: string;
                            vehicleNumber: string;
                            quantity: number;
                            unitPrice: number;
                            amount: number;
                        }) => ({
                            productName: item.productName,
                            vehicleNumber: item.vehicleNumber,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            amount: item.amount,
                        })
                    ),
                },
                subcontractors: {
                    create: data.subcontractors?.map(
                        (item: { companyName: string; workerCount: number; workerName: string }) => ({
                            companyName: item.companyName,
                            workerCount: item.workerCount,
                            workerName: item.workerName,
                        })
                    ),
                },
            },
        });

        return NextResponse.json(report);
    } catch (error) {
        console.error("Error updating report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 日報削除
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const reportId = parseInt(id);

        const existingReport = await prisma.dailyReport.findUnique({
            where: { id: reportId },
        });

        if (!existingReport) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // 管理者のみ削除可能
        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.dailyReport.delete({ where: { id: reportId } });

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        console.error("Error deleting report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
