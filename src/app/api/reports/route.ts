export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 日報一覧取得
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status");
        const projectName = searchParams.get("projectName");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: Record<string, unknown> = {};

        // 作業員は自分の日報のみ
        if (session.user.role === "worker") {
            where.createdById = parseInt(session.user.id);
        }

        if (status) {
            where.status = status;
        }

        if (projectName) {
            where.projectName = { contains: projectName };
        }

        if (startDate) {
            where.reportDate = {
                ...((where.reportDate as object) || {}),
                gte: new Date(startDate),
            };
        }

        if (endDate) {
            where.reportDate = {
                ...((where.reportDate as object) || {}),
                lte: new Date(endDate),
            };
        }

        const [reports, total] = await Promise.all([
            prisma.dailyReport.findMany({
                where,
                orderBy: { reportDate: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    createdBy: {
                        select: { fullName: true },
                    },
                    laborCosts: true,
                    companyEquipment: true,
                    materials: true,
                    leasedEquipment: true,
                    fuelCosts: true,
                },
            }),
            prisma.dailyReport.count({ where }),
        ]);

        // 各日報の合計を計算
        const reportsWithTotal = reports.map((report) => {
            const laborTotal = report.laborCosts.reduce((sum, item) => sum + item.amount, 0);
            const equipmentTotal = report.companyEquipment.reduce(
                (sum, item) => sum + item.amount,
                0
            );
            const materialTotal = report.materials.reduce((sum, item) => sum + item.amount, 0);
            const leasedTotal = report.leasedEquipment.reduce(
                (sum, item) => sum + item.amount,
                0
            );
            const fuelTotal = report.fuelCosts.reduce((sum, item) => sum + item.amount, 0);

            return {
                ...report,
                totalAmount: laborTotal + equipmentTotal + materialTotal + leasedTotal + fuelTotal,
            };
        });

        return NextResponse.json({
            reports: reportsWithTotal,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 日報作成
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        const report = await prisma.dailyReport.create({
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
                status: data.status || "draft",
                createdById: parseInt(session.user.id),
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

        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error("Error creating report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
