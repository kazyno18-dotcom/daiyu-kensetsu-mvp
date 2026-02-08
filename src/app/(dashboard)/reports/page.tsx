"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
    Search,
    Filter,
    FileText,
    Plus,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface Report {
    id: number;
    reportDate: string;
    projectName: string;
    reporterName: string;
    status: string;
    totalAmount: number;
    createdBy: { fullName: string };
}

interface ReportsResponse {
    reports: Report[];
    total: number;
    page: number;
    totalPages: number;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "下書き", color: "bg-gray-100 text-gray-700" },
    submitted: { label: "承認待ち", color: "bg-amber-100 text-amber-700" },
    approved: { label: "承認済み", color: "bg-green-100 text-green-700" },
    rejected: { label: "差し戻し", color: "bg-red-100 text-red-700" },
};

export default function ReportsListPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // フィルター
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [projectFilter, setProjectFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            if (statusFilter) params.set("status", statusFilter);
            if (projectFilter) params.set("projectName", projectFilter);
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);

            const response = await fetch(`/api/reports?${params.toString()}`);
            const data: ReportsResponse = await response.json();

            setReports(data.reports);
            setTotalPages(data.totalPages);
            setTotal(data.total);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page, statusFilter, projectFilter, startDate, endDate]);

    const handleSearch = () => {
        setPage(1);
        fetchReports();
    };

    const clearFilters = () => {
        setStatusFilter("");
        setProjectFilter("");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                        日報一覧
                    </h1>
                    <p className="text-slate-500 mt-1">全{total}件</p>
                </div>
                <Link
                    href="/reports/new"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">新規作成</span>
                </Link>
            </div>

            {/* 検索・フィルター */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            placeholder="工事名で検索..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${showFilters
                                ? "bg-orange-50 border-orange-200 text-orange-600"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                        <span className="hidden sm:inline">フィルター</span>
                    </button>
                </div>

                {/* 詳細フィルター */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                状態
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="">すべて</option>
                                <option value="draft">下書き</option>
                                <option value="submitted">承認待ち</option>
                                <option value="approved">承認済み</option>
                                <option value="rejected">差し戻し</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                開始日
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                終了日
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleSearch}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                検索
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                クリア
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 一覧テーブル */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-slate-500 mt-4">読み込み中...</p>
                    </div>
                ) : reports.length > 0 ? (
                    <>
                        {/* デスクトップテーブル */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            日付
                                        </th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            工事名
                                        </th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            記入者
                                        </th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            状態
                                        </th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">
                                            合計金額
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reports.map((report) => (
                                        <tr
                                            key={report.id}
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/reports/${report.id}`}
                                                    className="text-slate-800 hover:text-orange-600 font-medium"
                                                >
                                                    {format(new Date(report.reportDate), "yyyy/MM/dd", {
                                                        locale: ja,
                                                    })}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/reports/${report.id}`}
                                                    className="text-slate-800 hover:text-orange-600"
                                                >
                                                    {report.projectName}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {report.reporterName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusLabels[report.status]?.color
                                                        }`}
                                                >
                                                    {statusLabels[report.status]?.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-800">
                                                ¥{report.totalAmount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* モバイルリスト */}
                        <div className="lg:hidden divide-y divide-slate-100">
                            {reports.map((report) => (
                                <Link
                                    key={report.id}
                                    href={`/reports/${report.id}`}
                                    className="block p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-500">
                                            {format(new Date(report.reportDate), "yyyy/MM/dd", {
                                                locale: ja,
                                            })}
                                        </span>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[report.status]?.color
                                                }`}
                                        >
                                            {statusLabels[report.status]?.label}
                                        </span>
                                    </div>
                                    <p className="font-medium text-slate-800 truncate">
                                        {report.projectName}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm text-slate-500">
                                            {report.reporterName}
                                        </span>
                                        <span className="font-medium text-slate-800">
                                            ¥{report.totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
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

                {/* ページネーション */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                        <p className="text-sm text-slate-600">
                            全{total}件中 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}件を表示
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-3 py-1 text-sm text-slate-600">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
