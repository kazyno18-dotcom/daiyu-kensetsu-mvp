"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function ApprovalButtons({ reportId }: { reportId: number }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleApproval = async (action: "approve" | "reject") => {
        setLoading(true);
        try {
            const response = await fetch(`/api/reports/${reportId}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (response.ok) {
                router.refresh();
            } else {
                alert("処理に失敗しました");
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-amber-700 font-medium mb-3">
                この日報は承認待ちです
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => handleApproval("approve")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    <CheckCircle className="w-4 h-4" />
                    承認する
                </button>
                <button
                    onClick={() => handleApproval("reject")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    <XCircle className="w-4 h-4" />
                    差し戻し
                </button>
            </div>
        </div>
    );
}
