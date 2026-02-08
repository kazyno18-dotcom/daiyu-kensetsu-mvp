import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// PDFをHTMLベースで生成（ブラウザで印刷用）
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

        const reportDate = format(new Date(report.reportDate), "yyyy年M月d日（E）", { locale: ja });

        // 合計計算
        const laborTotal = report.laborCosts.reduce((sum, item) => sum + item.amount, 0);
        const equipTotal = report.companyEquipment.reduce((sum, item) => sum + item.amount, 0);
        const matTotal = report.materials.reduce((sum, item) => sum + item.amount, 0);
        const leasedTotal = report.leasedEquipment.reduce((sum, item) => sum + item.amount, 0);
        const fuelTotal = report.fuelCosts.reduce((sum, item) => sum + item.amount, 0);
        const grandTotal = laborTotal + equipTotal + matTotal + leasedTotal + fuelTotal;

        // 印刷用HTMLを生成
        const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>工事日報 - ${reportDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
      font-size: 12px;
      line-height: 1.4;
      padding: 20px;
      max-width: 210mm;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      margin-bottom: 20px;
      letter-spacing: 0.5em;
    }
    .header-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 15px;
      border: 1px solid #333;
      padding: 10px;
    }
    .header-info div { display: flex; gap: 5px; }
    .header-info label { font-weight: bold; min-width: 60px; }
    .project-name {
      border: 1px solid #333;
      padding: 10px;
      margin-bottom: 15px;
    }
    .project-name label { font-weight: bold; }
    .section { margin-bottom: 20px; }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 5px;
      background: #f0f0f0;
      padding: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    th, td {
      border: 1px solid #333;
      padding: 6px;
      text-align: left;
    }
    th {
      background: #e0e0e0;
      font-weight: bold;
      text-align: center;
    }
    .amount { text-align: right; }
    .total-row { background: #f5f5f5; font-weight: bold; }
    .grand-total {
      font-size: 16px;
      font-weight: bold;
      text-align: right;
      padding: 15px;
      background: linear-gradient(135deg, #f97316, #f59e0b);
      color: white;
      border-radius: 5px;
    }
    .work-content {
      border: 1px solid #333;
      padding: 10px;
      min-height: 80px;
      white-space: pre-wrap;
    }
    .subcontractor-section { margin-top: 15px; }
    @media print {
      body { padding: 10mm; }
      .no-print { display: none; }
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #f97316;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    .print-button:hover { background: #ea580c; }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">印刷 / PDF保存</button>
  
  <h1>工 事 日 報</h1>
  
  <div class="header-info">
    <div><label>日付:</label><span>${reportDate}</span></div>
    <div><label>天気:</label><span>${report.weather || ""}</span></div>
    <div><label>記入者:</label><span>${report.reporterName}</span></div>
  </div>
  
  <div class="project-name">
    <label>工事名:</label> ${report.projectName}
    <span style="margin-left: 30px;"><label>作業時間:</label> ${report.workStartTime || ""} ～ ${report.workEndTime || ""}</span>
  </div>

  ${report.laborCosts.length > 0 ? `
  <div class="section">
    <div class="section-title">① 労務費</div>
    <table>
      <tr>
        <th>出勤者名</th>
        <th>時間</th>
        <th>単価</th>
        <th>金額</th>
      </tr>
      ${report.laborCosts.map(item => `
      <tr>
        <td>${item.workerName}</td>
        <td class="amount">${item.hours}h</td>
        <td class="amount">¥${item.unitPrice.toLocaleString()}</td>
        <td class="amount">¥${item.amount.toLocaleString()}</td>
      </tr>
      `).join("")}
      <tr class="total-row">
        <td colspan="3">労務費計</td>
        <td class="amount">¥${laborTotal.toLocaleString()}</td>
      </tr>
    </table>
    ${report.absentWorkers ? `<p>欠勤者: ${report.absentWorkers}</p>` : ""}
  </div>
  ` : ""}

  ${report.companyEquipment.length > 0 ? `
  <div class="section">
    <div class="section-title">③ 自社機械経費</div>
    <table>
      <tr>
        <th>機械名</th>
        <th>時間</th>
        <th>単価</th>
        <th>金額</th>
      </tr>
      ${report.companyEquipment.map(item => `
      <tr>
        <td>${item.equipmentName}</td>
        <td class="amount">${item.hours}h</td>
        <td class="amount">¥${item.unitPrice.toLocaleString()}</td>
        <td class="amount">¥${item.amount.toLocaleString()}</td>
      </tr>
      `).join("")}
      <tr class="total-row">
        <td colspan="3">自社機械経費計</td>
        <td class="amount">¥${equipTotal.toLocaleString()}</td>
      </tr>
    </table>
  </div>
  ` : ""}

  ${report.materials.length > 0 ? `
  <div class="section">
    <div class="section-title">② 材料費</div>
    <table>
      <tr>
        <th>仕入先</th>
        <th>材料名</th>
        <th>数量</th>
        <th>単価</th>
        <th>金額</th>
      </tr>
      ${report.materials.map(item => `
      <tr>
        <td>${item.supplier || ""}</td>
        <td>${item.materialName}</td>
        <td class="amount">${item.quantity}</td>
        <td class="amount">¥${item.unitPrice.toLocaleString()}</td>
        <td class="amount">¥${item.amount.toLocaleString()}</td>
      </tr>
      `).join("")}
      <tr class="total-row">
        <td colspan="4">材料費計</td>
        <td class="amount">¥${matTotal.toLocaleString()}</td>
      </tr>
    </table>
  </div>
  ` : ""}

  ${report.leasedEquipment.length > 0 ? `
  <div class="section">
    <div class="section-title">④ リース機械等</div>
    <table>
      <tr>
        <th>借入先</th>
        <th>機械名</th>
        <th>時間</th>
        <th>単価</th>
        <th>金額</th>
      </tr>
      ${report.leasedEquipment.map(item => `
      <tr>
        <td>${item.lender || ""}</td>
        <td>${item.equipmentName}</td>
        <td class="amount">${item.hours}h</td>
        <td class="amount">¥${item.unitPrice.toLocaleString()}</td>
        <td class="amount">¥${item.amount.toLocaleString()}</td>
      </tr>
      `).join("")}
      <tr class="total-row">
        <td colspan="4">リース機械等計</td>
        <td class="amount">¥${leasedTotal.toLocaleString()}</td>
      </tr>
    </table>
  </div>
  ` : ""}

  ${report.fuelCosts.length > 0 ? `
  <div class="section">
    <div class="section-title">⑤ 燃料費</div>
    <table>
      <tr>
        <th>品名</th>
        <th>車番</th>
        <th>数量</th>
        <th>単価</th>
        <th>金額</th>
      </tr>
      ${report.fuelCosts.map(item => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.vehicleNumber || ""}</td>
        <td class="amount">${item.quantity}L</td>
        <td class="amount">¥${item.unitPrice.toLocaleString()}</td>
        <td class="amount">¥${item.amount.toLocaleString()}</td>
      </tr>
      `).join("")}
      <tr class="total-row">
        <td colspan="4">燃料費計</td>
        <td class="amount">¥${fuelTotal.toLocaleString()}</td>
      </tr>
    </table>
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">作業内容</div>
    <div class="work-content">
      ${report.repairContent ? `【補修】${report.repairContent}\n` : ""}
      ${report.cleanupContent ? `【現場片付け】${report.cleanupContent}\n` : ""}
      ${report.workContent || ""}
    </div>
  </div>

  ${report.subcontractors.length > 0 ? `
  <div class="section subcontractor-section">
    <div class="section-title">外注</div>
    <table>
      <tr>
        <th>社名</th>
        <th>人数</th>
        <th>名前</th>
      </tr>
      ${report.subcontractors.map(item => `
      <tr>
        <td>${item.companyName || ""}</td>
        <td class="amount">${item.workerCount || 0}名</td>
        <td>${item.workerName || ""}</td>
      </tr>
      `).join("")}
    </table>
  </div>
  ` : ""}

  <div class="grand-total">
    総合計: ¥${grandTotal.toLocaleString()}
  </div>

  <script>
    // 印刷時に自動でダイアログを表示（オプション）
    // window.onload = () => window.print();
  </script>
</body>
</html>
    `;

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        });
    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
