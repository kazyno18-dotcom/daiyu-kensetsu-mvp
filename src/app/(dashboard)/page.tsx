import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    FileText,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getRecentReports(userId: string, role: string) {
    const where = role === "worker" ? { createdById: parseInt(userId) } : {};

    return prisma.dailyReport.findMany({
        where,
        orderBy: { reportDate: "desc" },
        take: 5,
        include: {
            createdBy: true,
        },
    });
}

async function getStats(userId: string, role: string) {
    const where = role === "worker" ? { createdById: parseInt(userId) } : {};

    const [total, draft, submitted, approved] = await Promise.all([
        prisma.dailyReport.count({ where }),
        prisma.dailyReport.count({ where: { ...where, status: "draft" } }),
        prisma.dailyReport.count({ where: { ...where, status: "submitted" } }),
        prisma.dailyReport.count({ where: { ...where, status: "approved" } }),
    ]);

    return { total, draft, submitted, approved };
}

const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "下書き", color: "bg-gray-100 text-gray-700" },
    submitted: { label: "承認待ち", color: "bg-amber-100 text-amber-700" },
    approved: { label: "承認済み", color: "bg-green-100 text-green-700" },
    rejected: { label: "差し戻し", color: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
    const session = await auth();
    const userId = session?.user?.id || "0";
    const role = session?.user?.role || "worker";

    const [recentReports, stats] = await Promise.all([
        getRecentReports(userId, role),
        getStats(userId, role),
    ]);

    return (
        <div className="space-y-8">
            {/* ヘッダー */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                    ダッシュボード
                </h1>
                <p className="text-slate-500 mt-1">
                    {format(new Date(), "yyyy年M月d日（E）", { locale: ja })}
                </p>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">総日報数</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">
                                {stats.total}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-slate-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">下書き</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">
                                {stats.draft}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">承認待ち</p>
                            <p className="text-3xl font-bold text-amber-600 mt-1">
                                {stats.submitted}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">承認済み</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">
                                {stats.approved}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* クイックアクション */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Link
                    href="/reports/new"
                    className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <Plus className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">新しい日報を作成</h3>
                            <p className="text-orange-100 text-sm mt-1">
                                今日の作業内容を記録
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/reports"
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 hover:shadow-lg transform hover:scale-[1.02] transition-all"
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-7 h-7 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">日報一覧を見る</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                過去の日報を確認・編集
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* 最近の日報 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">最近の日報</h2>
                </div>
                {recentReports.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {recentReports.map((report) => (
                            <Link
                                key={report.id}
                                href={`/reports/${report.id}`}
                                className="flex items-center justify-between p-4 lg:p-6 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <p className="font-semibold text-slate-800 truncate">
                                            {report.projectName}
                                        </p>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[report.status]?.color
                                                }`}
                                        >
                                            {statusLabels[report.status]?.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {format(new Date(report.reportDate), "yyyy年M月d日", {
                                            locale: ja,
                                        })}{" "}
                                        • {report.reporterName}
                                    </p>
                                </div>
                                <svg
                                    className="w-5 h-5 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">日報がありません</p>
                        <Link
                            href="/reports/new"
                            className="inline-block mt-4 text-orange-500 hover:text-orange-600 font-medium"
                        >
                            最初の日報を作成する →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
