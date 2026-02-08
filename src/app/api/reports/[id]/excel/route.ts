export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

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
                createdBy: { select: { fullName: true } },
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

        // Excelワークブック作成
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "ダイユウ建設 日報システム";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("日報");

        // スタイル定義
        const headerStyle: Partial<ExcelJS.Style> = {
            font: { bold: true, size: 12 },
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } },
            border: {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            },
            alignment: { horizontal: "center", vertical: "middle" },
        };

        const cellStyle: Partial<ExcelJS.Style> = {
            border: {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            },
            alignment: { vertical: "middle" },
        };

        // 列幅設定
        worksheet.columns = [
            { width: 15 },
            { width: 20 },
            { width: 15 },
            { width: 12 },
            { width: 12 },
            { width: 15 },
        ];

        // タイトル
        worksheet.mergeCells("A1:F1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "工 事 日 報";
        titleCell.font = { bold: true, size: 18 };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;

        // 基本情報
        let rowNum = 3;
        const reportDate = format(new Date(report.reportDate), "yyyy年M月d日（E）", { locale: ja });

        worksheet.getCell(`A${rowNum}`).value = "日付";
        worksheet.getCell(`B${rowNum}`).value = reportDate;
        worksheet.getCell(`C${rowNum}`).value = "天気";
        worksheet.getCell(`D${rowNum}`).value = report.weather;
        worksheet.getCell(`E${rowNum}`).value = "記入者";
        worksheet.getCell(`F${rowNum}`).value = report.reporterName;
        rowNum++;

        worksheet.getCell(`A${rowNum}`).value = "工事名";
        worksheet.mergeCells(`B${rowNum}:F${rowNum}`);
        worksheet.getCell(`B${rowNum}`).value = report.projectName;
        rowNum++;

        worksheet.getCell(`A${rowNum}`).value = "作業時間";
        worksheet.getCell(`B${rowNum}`).value = `${report.workStartTime || ""} ～ ${report.workEndTime || ""}`;
        rowNum += 2;

        // 労務費セクション
        if (report.laborCosts.length > 0) {
            worksheet.getCell(`A${rowNum}`).value = "① 労務費";
            worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 12 };
            rowNum++;

            const laborHeaders = ["出勤者名", "", "時間", "単価", "金額", ""];
            laborHeaders.forEach((header, idx) => {
                const cell = worksheet.getCell(rowNum, idx + 1);
                cell.value = header;
                Object.assign(cell, headerStyle);
            });
            rowNum++;

            let laborTotal = 0;
            report.laborCosts.forEach((item) => {
                worksheet.getCell(rowNum, 1).value = item.workerName;
                worksheet.getCell(rowNum, 3).value = item.hours;
                worksheet.getCell(rowNum, 4).value = item.unitPrice;
                worksheet.getCell(rowNum, 5).value = item.amount;
                laborTotal += item.amount;
                for (let i = 1; i <= 6; i++) {
                    Object.assign(worksheet.getCell(rowNum, i), cellStyle);
                }
                rowNum++;
            });

            worksheet.getCell(rowNum, 1).value = "労務費計";
            worksheet.getCell(rowNum, 1).font = { bold: true };
            worksheet.getCell(rowNum, 5).value = laborTotal;
            worksheet.getCell(rowNum, 5).font = { bold: true };
            rowNum += 2;
        }

        // 自社機械経費
        if (report.companyEquipment.length > 0) {
            worksheet.getCell(`A${rowNum}`).value = "③ 自社機械経費";
            worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 12 };
            rowNum++;

            const equipHeaders = ["機械名", "", "時間", "単価", "金額", ""];
            equipHeaders.forEach((header, idx) => {
                const cell = worksheet.getCell(rowNum, idx + 1);
                cell.value = header;
                Object.assign(cell, headerStyle);
            });
            rowNum++;

            let equipTotal = 0;
            report.companyEquipment.forEach((item) => {
                worksheet.getCell(rowNum, 1).value = item.equipmentName;
                worksheet.getCell(rowNum, 3).value = item.hours;
                worksheet.getCell(rowNum, 4).value = item.unitPrice;
                worksheet.getCell(rowNum, 5).value = item.amount;
                equipTotal += item.amount;
                for (let i = 1; i <= 6; i++) {
                    Object.assign(worksheet.getCell(rowNum, i), cellStyle);
                }
                rowNum++;
            });

            worksheet.getCell(rowNum, 1).value = "自社機械経費計";
            worksheet.getCell(rowNum, 1).font = { bold: true };
            worksheet.getCell(rowNum, 5).value = equipTotal;
            worksheet.getCell(rowNum, 5).font = { bold: true };
            rowNum += 2;
        }

        // 材料費
        if (report.materials.length > 0) {
            worksheet.getCell(`A${rowNum}`).value = "② 材料費";
            worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 12 };
            rowNum++;

            const matHeaders = ["仕入先", "材料名", "数量", "単価", "金額", ""];
            matHeaders.forEach((header, idx) => {
                const cell = worksheet.getCell(rowNum, idx + 1);
                cell.value = header;
                Object.assign(cell, headerStyle);
            });
            rowNum++;

            let matTotal = 0;
            report.materials.forEach((item) => {
                worksheet.getCell(rowNum, 1).value = item.supplier;
                worksheet.getCell(rowNum, 2).value = item.materialName;
                worksheet.getCell(rowNum, 3).value = item.quantity;
                worksheet.getCell(rowNum, 4).value = item.unitPrice;
                worksheet.getCell(rowNum, 5).value = item.amount;
                matTotal += item.amount;
                for (let i = 1; i <= 6; i++) {
                    Object.assign(worksheet.getCell(rowNum, i), cellStyle);
                }
                rowNum++;
            });

            worksheet.getCell(rowNum, 1).value = "材料費計";
            worksheet.getCell(rowNum, 1).font = { bold: true };
            worksheet.getCell(rowNum, 5).value = matTotal;
            worksheet.getCell(rowNum, 5).font = { bold: true };
            rowNum += 2;
        }

        // 燃料費
        if (report.fuelCosts.length > 0) {
            worksheet.getCell(`A${rowNum}`).value = "⑤ 燃料費";
            worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 12 };
            rowNum++;

            const fuelHeaders = ["品名", "車番", "数量", "単価", "金額", ""];
            fuelHeaders.forEach((header, idx) => {
                const cell = worksheet.getCell(rowNum, idx + 1);
                cell.value = header;
                Object.assign(cell, headerStyle);
            });
            rowNum++;

            let fuelTotal = 0;
            report.fuelCosts.forEach((item) => {
                worksheet.getCell(rowNum, 1).value = item.productName;
                worksheet.getCell(rowNum, 2).value = item.vehicleNumber;
                worksheet.getCell(rowNum, 3).value = item.quantity;
                worksheet.getCell(rowNum, 4).value = item.unitPrice;
                worksheet.getCell(rowNum, 5).value = item.amount;
                fuelTotal += item.amount;
                for (let i = 1; i <= 6; i++) {
                    Object.assign(worksheet.getCell(rowNum, i), cellStyle);
                }
                rowNum++;
            });

            worksheet.getCell(rowNum, 1).value = "燃料費計";
            worksheet.getCell(rowNum, 1).font = { bold: true };
            worksheet.getCell(rowNum, 5).value = fuelTotal;
            worksheet.getCell(rowNum, 5).font = { bold: true };
            rowNum += 2;
        }

        // 作業内容
        if (report.workContent) {
            worksheet.getCell(`A${rowNum}`).value = "作業内容";
            worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 12 };
            rowNum++;
            worksheet.mergeCells(`A${rowNum}:F${rowNum + 2}`);
            worksheet.getCell(`A${rowNum}`).value = report.workContent;
            worksheet.getCell(`A${rowNum}`).alignment = { wrapText: true, vertical: "top" };
            rowNum += 4;
        }

        // 合計計算
        const laborTotal = report.laborCosts.reduce((sum, item) => sum + item.amount, 0);
        const equipTotal = report.companyEquipment.reduce((sum, item) => sum + item.amount, 0);
        const matTotal = report.materials.reduce((sum, item) => sum + item.amount, 0);
        const leasedTotal = report.leasedEquipment.reduce((sum, item) => sum + item.amount, 0);
        const fuelTotal = report.fuelCosts.reduce((sum, item) => sum + item.amount, 0);
        const grandTotal = laborTotal + equipTotal + matTotal + leasedTotal + fuelTotal;

        worksheet.getCell(`A${rowNum}`).value = "総合計";
        worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 14 };
        worksheet.getCell(`E${rowNum}`).value = grandTotal;
        worksheet.getCell(`E${rowNum}`).font = { bold: true, size: 14 };
        worksheet.getCell(`E${rowNum}`).numFmt = "¥#,##0";

        // バッファに書き込み
        const buffer = await workbook.xlsx.writeBuffer();

        const filename = `日報_${format(new Date(report.reportDate), "yyyyMMdd")}_${report.projectName}.xlsx`;

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
            },
        });
    } catch (error) {
        console.error("Error generating Excel:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
