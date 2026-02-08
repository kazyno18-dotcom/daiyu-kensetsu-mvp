import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import {
    ArrowLeft,
    Edit,
    CheckCircle,
    XCircle,
    Calendar,
    Clock,
    User,
    Cloud,
    Download,
    FileSpreadsheet,
    Printer,
} from "lucide-react";
import ApprovalButtons from "./ApprovalButtons";

const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "下書き", color: "bg-gray-100 text-gray-700" },
    submitted: { label: "承認待ち", color: "bg-amber-100 text-amber-700" },
    approved: { label: "承認済み", color: "bg-green-100 text-green-700" },
    rejected: { label: "差し戻し", color: "bg-red-100 text-red-700" },
};

export default async function ReportDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session) {
        redirect("/login");
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
        notFound();
    }

    // 作業員は自分の日報のみ閲覧可
    if (
        session.user.role === "worker" &&
        report.createdById !== parseInt(session.user.id || "0")
    ) {
        redirect("/reports");
    }

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
    const grandTotal = laborTotal + equipmentTotal + materialTotal + leasedTotal + fuelTotal;

    const canApprove =
        session.user.role === "admin" || session.user.role === "manager";
    const canEdit =
        session.user.role === "admin" ||
        (report.createdById === parseInt(session.user.id || "0") &&
            report.status !== "approved");

    return (
        <div className="max-w-5xl mx-auto pb-8">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/reports"
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">日報詳細</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[report.status]?.color
                                    }`}
                            >
                                {statusLabels[report.status]?.label}
                            </span>
                            {report.approvedBy && (
                                <span className="text-xs text-slate-500">
                                    承認者: {report.approvedBy.fullName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`/api/reports/${report.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        印刷/PDF
                    </a>
                    <a
                        href={`/api/reports/${report.id}/excel`}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium rounded-lg transition-colors"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel
                    </a>
                    {canEdit && (
                        <Link
                            href={`/reports/${report.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            編集
                        </Link>
                    )}
                </div>
            </div>

            {/* 承認ボタン */}
            {canApprove && report.status === "submitted" && (
                <ApprovalButtons reportId={report.id} />
            )}

            <div className="space-y-6">
                {/* 基本情報 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">基本情報</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">日付</p>
                                <p className="font-medium text-slate-800">
                                    {format(new Date(report.reportDate), "yyyy年M月d日（E）", {
                                        locale: ja,
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <Cloud className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">天気</p>
                                <p className="font-medium text-slate-800">{report.weather}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <User className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">記入者</p>
                                <p className="font-medium text-slate-800">{report.reporterName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">作業時間</p>
                                <p className="font-medium text-slate-800">
                                    {report.workStartTime} 〜 {report.workEndTime}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-600 mb-1">工事名</p>
                        <p className="font-bold text-slate-800">{report.projectName}</p>
                    </div>
                </div>

                {/* 労務費 */}
                {report.laborCosts.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            ① 労務費
                        </h2>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b">
                                    <th className="pb-2">出勤者名</th>
                                    <th className="pb-2 text-right">時間</th>
                                    <th className="pb-2 text-right">単価</th>
                                    <th className="pb-2 text-right">金額</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.laborCosts.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-50">
                                        <td className="py-2">{item.workerName}</td>
                                        <td className="py-2 text-right">{item.hours}h</td>
                                        <td className="py-2 text-right">¥{item.unitPrice.toLocaleString()}</td>
                                        <td className="py-2 text-right font-medium">
                                            ¥{item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-blue-50">
                                    <td colSpan={3} className="py-2 font-medium text-blue-700">
                                        労務費計
                                    </td>
                                    <td className="py-2 text-right font-bold text-blue-700">
                                        ¥{laborTotal.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                        {report.absentWorkers && (
                            <p className="text-sm text-slate-600 mt-3">
                                ※ 欠勤者: {report.absentWorkers}
                            </p>
                        )}
                    </div>
                )}

                {/* 自社機械経費 */}
                {report.companyEquipment.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            ③ 自社機械経費
                        </h2>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b">
                                    <th className="pb-2">機械名</th>
                                    <th className="pb-2 text-right">時間</th>
                                    <th className="pb-2 text-right">単価</th>
                                    <th className="pb-2 text-right">金額</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.companyEquipment.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-50">
                                        <td className="py-2">{item.equipmentName}</td>
                                        <td className="py-2 text-right">{item.hours}h</td>
                                        <td className="py-2 text-right">¥{item.unitPrice.toLocaleString()}</td>
                                        <td className="py-2 text-right font-medium">
                                            ¥{item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-green-50">
                                    <td colSpan={3} className="py-2 font-medium text-green-700">
                                        自社機械経費計
                                    </td>
                                    <td className="py-2 text-right font-bold text-green-700">
                                        ¥{equipmentTotal.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* 材料費 */}
                {report.materials.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">② 材料費</h2>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b">
                                    <th className="pb-2">仕入先</th>
                                    <th className="pb-2">材料名</th>
                                    <th className="pb-2 text-right">数量</th>
                                    <th className="pb-2 text-right">単価</th>
                                    <th className="pb-2 text-right">金額</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.materials.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-50">
                                        <td className="py-2">{item.supplier}</td>
                                        <td className="py-2">{item.materialName}</td>
                                        <td className="py-2 text-right">{item.quantity}</td>
                                        <td className="py-2 text-right">¥{item.unitPrice.toLocaleString()}</td>
                                        <td className="py-2 text-right font-medium">
                                            ¥{item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-purple-50">
                                    <td colSpan={4} className="py-2 font-medium text-purple-700">
                                        材料費計
                                    </td>
                                    <td className="py-2 text-right font-bold text-purple-700">
                                        ¥{materialTotal.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* リース機械 */}
                {report.leasedEquipment.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            ④ リース機械等
                        </h2>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b">
                                    <th className="pb-2">借入先</th>
                                    <th className="pb-2">機械名</th>
                                    <th className="pb-2 text-right">時間</th>
                                    <th className="pb-2 text-right">単価</th>
                                    <th className="pb-2 text-right">金額</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.leasedEquipment.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-50">
                                        <td className="py-2">{item.lender}</td>
                                        <td className="py-2">{item.equipmentName}</td>
                                        <td className="py-2 text-right">{item.hours}h</td>
                                        <td className="py-2 text-right">¥{item.unitPrice.toLocaleString()}</td>
                                        <td className="py-2 text-right font-medium">
                                            ¥{item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-amber-50">
                                    <td colSpan={4} className="py-2 font-medium text-amber-700">
                                        リース機械等計
                                    </td>
                                    <td className="py-2 text-right font-bold text-amber-700">
                                        ¥{leasedTotal.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* 燃料費 */}
                {report.fuelCosts.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">⑤ 燃料費</h2>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b">
                                    <th className="pb-2">品名</th>
                                    <th className="pb-2">車番</th>
                                    <th className="pb-2 text-right">数量</th>
                                    <th className="pb-2 text-right">単価</th>
                                    <th className="pb-2 text-right">金額</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.fuelCosts.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-50">
                                        <td className="py-2">{item.productName}</td>
                                        <td className="py-2">{item.vehicleNumber}</td>
                                        <td className="py-2 text-right">{item.quantity}L</td>
                                        <td className="py-2 text-right">¥{item.unitPrice.toLocaleString()}</td>
                                        <td className="py-2 text-right font-medium">
                                            ¥{item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-red-50">
                                    <td colSpan={4} className="py-2 font-medium text-red-700">
                                        燃料費計
                                    </td>
                                    <td className="py-2 text-right font-bold text-red-700">
                                        ¥{fuelTotal.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* 作業内容 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">作業内容</h2>
                    <div className="space-y-4">
                        {report.repairContent && (
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">補修</p>
                                <p className="text-slate-800 whitespace-pre-wrap">
                                    {report.repairContent}
                                </p>
                            </div>
                        )}
                        {report.cleanupContent && (
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">
                                    現場片付け
                                </p>
                                <p className="text-slate-800 whitespace-pre-wrap">
                                    {report.cleanupContent}
                                </p>
                            </div>
                        )}
                        {report.workContent && (
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">
                                    作業内容
                                </p>
                                <p className="text-slate-800 whitespace-pre-wrap">
                                    {report.workContent}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 外注 */}
                {report.subcontractors.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">外注</h2>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b">
                                    <th className="pb-2">社名</th>
                                    <th className="pb-2 text-right">人数</th>
                                    <th className="pb-2">名前</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.subcontractors.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-50">
                                        <td className="py-2">{item.companyName}</td>
                                        <td className="py-2 text-right">{item.workerCount}名</td>
                                        <td className="py-2">{item.workerName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 合計 */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">総合計</h2>
                        <p className="text-3xl font-bold">¥{grandTotal.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
