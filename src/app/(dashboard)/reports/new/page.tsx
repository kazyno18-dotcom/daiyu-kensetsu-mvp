"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
    Save,
    Send,
    ArrowLeft,
    Plus,
    Trash2,
    Calculator,
    Cloud,
    Sun,
    CloudRain,
    CloudSnow,
} from "lucide-react";

// 天気オプション
const weatherOptions = [
    { value: "晴れ", icon: Sun, label: "晴れ" },
    { value: "曇り", icon: Cloud, label: "曇り" },
    { value: "雨", icon: CloudRain, label: "雨" },
    { value: "雪", icon: CloudSnow, label: "雪" },
];

// 機械選択肢
const equipmentOptions = [
    "4t ダンプ",
    "2t ダンプ",
    "0.2 ユンボ",
    "0.25ユンボ",
    "0.45ユンボ",
    "軽 トラック",
    "軽 ダンプ",
    "ハンマードリル",
    "発電機",
    "水中ポンプ",
    "その他",
];

// 燃料選択肢
const fuelOptions = ["ガソリン", "軽油", "オイル", "その他"];

// 型定義
interface LaborCostRow {
    id: string;
    workerName: string;
    hours: number;
    unitPrice: number;
    amount: number;
}

interface EquipmentRow {
    id: string;
    equipmentName: string;
    hours: number;
    unitPrice: number;
    amount: number;
}

interface MaterialRow {
    id: string;
    supplier: string;
    materialName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

interface LeasedEquipmentRow {
    id: string;
    lender: string;
    equipmentName: string;
    hours: number;
    unitPrice: number;
    amount: number;
}

interface FuelCostRow {
    id: string;
    productName: string;
    vehicleNumber: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

interface SubcontractorRow {
    id: string;
    companyName: string;
    workerCount: number;
    workerName: string;
}

// ユニークID生成
const generateId = () => Math.random().toString(36).substring(7);

export default function CreateReportPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ヘッダー情報
    const [reportDate, setReportDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [weather, setWeather] = useState("晴れ");
    const [reporterName, setReporterName] = useState("");
    const [projectName, setProjectName] = useState("");
    const [workStartTime, setWorkStartTime] = useState("08:00");
    const [workEndTime, setWorkEndTime] = useState("17:00");

    // 労務費
    const [laborCosts, setLaborCosts] = useState<LaborCostRow[]>([
        { id: generateId(), workerName: "", hours: 0, unitPrice: 0, amount: 0 },
        { id: generateId(), workerName: "", hours: 0, unitPrice: 0, amount: 0 },
        { id: generateId(), workerName: "", hours: 0, unitPrice: 0, amount: 0 },
    ]);
    const [absentWorkers, setAbsentWorkers] = useState("");

    // 自社機械経費
    const [companyEquipment, setCompanyEquipment] = useState<EquipmentRow[]>([
        { id: generateId(), equipmentName: "", hours: 0, unitPrice: 0, amount: 0 },
        { id: generateId(), equipmentName: "", hours: 0, unitPrice: 0, amount: 0 },
    ]);

    // 材料費
    const [materials, setMaterials] = useState<MaterialRow[]>([
        { id: generateId(), supplier: "", materialName: "", quantity: 0, unitPrice: 0, amount: 0 },
        { id: generateId(), supplier: "", materialName: "", quantity: 0, unitPrice: 0, amount: 0 },
    ]);

    // リース機械
    const [leasedEquipment, setLeasedEquipment] = useState<LeasedEquipmentRow[]>([
        { id: generateId(), lender: "", equipmentName: "", hours: 0, unitPrice: 0, amount: 0 },
    ]);

    // 燃料費
    const [fuelCosts, setFuelCosts] = useState<FuelCostRow[]>([
        { id: generateId(), productName: "", vehicleNumber: "", quantity: 0, unitPrice: 0, amount: 0 },
    ]);

    // 外注
    const [subcontractors, setSubcontractors] = useState<SubcontractorRow[]>([
        { id: generateId(), companyName: "", workerCount: 0, workerName: "" },
    ]);

    // 作業内容
    const [repairContent, setRepairContent] = useState("");
    const [cleanupContent, setCleanupContent] = useState("");
    const [workContent, setWorkContent] = useState("");

    // 記入者名の初期設定
    useEffect(() => {
        if (session?.user?.name) {
            setReporterName(session.user.name);
        }
    }, [session]);

    // 労務費の金額自動計算
    const updateLaborCost = (id: string, field: string, value: string | number) => {
        setLaborCosts((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                const updated = { ...row, [field]: value };
                updated.amount = updated.hours * updated.unitPrice;
                return updated;
            })
        );
    };

    // 自社機械の金額自動計算
    const updateEquipment = (id: string, field: string, value: string | number) => {
        setCompanyEquipment((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                const updated = { ...row, [field]: value };
                updated.amount = updated.hours * updated.unitPrice;
                return updated;
            })
        );
    };

    // 材料費の金額自動計算
    const updateMaterial = (id: string, field: string, value: string | number) => {
        setMaterials((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                const updated = { ...row, [field]: value };
                updated.amount = updated.quantity * updated.unitPrice;
                return updated;
            })
        );
    };

    // リース機械の金額自動計算
    const updateLeased = (id: string, field: string, value: string | number) => {
        setLeasedEquipment((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                const updated = { ...row, [field]: value };
                updated.amount = updated.hours * updated.unitPrice;
                return updated;
            })
        );
    };

    // 燃料費の金額自動計算
    const updateFuel = (id: string, field: string, value: string | number) => {
        setFuelCosts((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                const updated = { ...row, [field]: value };
                updated.amount = updated.quantity * updated.unitPrice;
                return updated;
            })
        );
    };

    // 外注の更新
    const updateSubcontractor = (id: string, field: string, value: string | number) => {
        setSubcontractors((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                return { ...row, [field]: value };
            })
        );
    };

    // 合計計算
    const laborTotal = laborCosts.reduce((sum, row) => sum + row.amount, 0);
    const equipmentTotal = companyEquipment.reduce((sum, row) => sum + row.amount, 0);
    const materialTotal = materials.reduce((sum, row) => sum + row.amount, 0);
    const leasedTotal = leasedEquipment.reduce((sum, row) => sum + row.amount, 0);
    const fuelTotal = fuelCosts.reduce((sum, row) => sum + row.amount, 0);

    // フォーム送信
    const handleSubmit = async (isDraft: boolean) => {
        if (isDraft) {
            setSaving(true);
        } else {
            setSubmitting(true);
        }

        try {
            const data = {
                reportDate,
                dayOfWeek: format(new Date(reportDate), "EEEE", { locale: ja }),
                weather,
                reporterName,
                projectName,
                workStartTime,
                workEndTime,
                absentWorkers,
                repairContent,
                cleanupContent,
                workContent,
                status: isDraft ? "draft" : "submitted",
                laborCosts: laborCosts.filter((r) => r.workerName),
                companyEquipment: companyEquipment.filter((r) => r.equipmentName),
                materials: materials.filter((r) => r.materialName),
                leasedEquipment: leasedEquipment.filter((r) => r.equipmentName),
                fuelCosts: fuelCosts.filter((r) => r.productName),
                subcontractors: subcontractors.filter((r) => r.companyName),
            };

            const response = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push("/reports");
            } else {
                alert("保存に失敗しました");
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setSaving(false);
            setSubmitting(false);
        }
    };

    const getDayOfWeek = () => {
        return format(new Date(reportDate), "EEEE", { locale: ja });
    };

    return (
        <div className="max-w-5xl mx-auto pb-24">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">工事日報作成</h1>
                        <p className="text-slate-500 text-sm">新しい日報を作成します</p>
                    </div>
                </div>
            </div>

            {/* フォーム */}
            <div className="space-y-6">
                {/* ヘッダー情報 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-sm font-bold">
                            1
                        </span>
                        基本情報
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 日付 */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                日付 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <p className="text-xs text-slate-500 mt-1">{getDayOfWeek()}</p>
                        </div>

                        {/* 天気 */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                天気
                            </label>
                            <div className="flex gap-2">
                                {weatherOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setWeather(opt.value)}
                                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg border transition-all ${weather === opt.value
                                                ? "bg-orange-50 border-orange-500 text-orange-600"
                                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                                            }`}
                                    >
                                        <opt.icon className="w-4 h-4" />
                                        <span className="text-sm">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 記入者名 */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                記入者名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={reporterName}
                                onChange={(e) => setReporterName(e.target.value)}
                                placeholder="記入者名"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        {/* 工事名 */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                工事名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="工事名を入力"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        {/* 作業時間 */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                作業時間
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={workStartTime}
                                    onChange={(e) => setWorkStartTime(e.target.value)}
                                    className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                <span className="text-slate-400">〜</span>
                                <input
                                    type="time"
                                    value={workEndTime}
                                    onChange={(e) => setWorkEndTime(e.target.value)}
                                    className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 労務費セクション */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-sm font-bold">
                            ①
                        </span>
                        労務費
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium">出勤者名</th>
                                    <th className="pb-2 font-medium w-24">時間</th>
                                    <th className="pb-2 font-medium w-28">単価</th>
                                    <th className="pb-2 font-medium w-32">金額</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {laborCosts.map((row) => (
                                    <tr key={row.id}>
                                        <td className="py-2">
                                            <input
                                                type="text"
                                                value={row.workerName}
                                                onChange={(e) =>
                                                    updateLaborCost(row.id, "workerName", e.target.value)
                                                }
                                                placeholder="作業員名"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.hours || ""}
                                                onChange={(e) =>
                                                    updateLaborCost(row.id, "hours", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.unitPrice || ""}
                                                onChange={(e) =>
                                                    updateLaborCost(row.id, "unitPrice", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <div className="px-3 py-2 bg-slate-50 rounded-lg text-right font-medium text-slate-700">
                                                ¥{row.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setLaborCosts((prev) => prev.filter((r) => r.id !== row.id))
                                                }
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <button
                            type="button"
                            onClick={() =>
                                setLaborCosts((prev) => [
                                    ...prev,
                                    { id: generateId(), workerName: "", hours: 0, unitPrice: 0, amount: 0 },
                                ])
                            }
                            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            行を追加
                        </button>
                        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                            <Calculator className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-blue-700">人①労務費計:</span>
                            <span className="text-lg font-bold text-blue-700">
                                ¥{laborTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            ※ 欠勤者名
                        </label>
                        <input
                            type="text"
                            value={absentWorkers}
                            onChange={(e) => setAbsentWorkers(e.target.value)}
                            placeholder="欠勤者がいる場合は記入"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* 自社機械経費セクション */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-sm font-bold">
                            ③
                        </span>
                        自社機械経費
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium">機械名</th>
                                    <th className="pb-2 font-medium w-24">時間</th>
                                    <th className="pb-2 font-medium w-28">単価</th>
                                    <th className="pb-2 font-medium w-32">金額</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {companyEquipment.map((row) => (
                                    <tr key={row.id}>
                                        <td className="py-2">
                                            <select
                                                value={row.equipmentName}
                                                onChange={(e) =>
                                                    updateEquipment(row.id, "equipmentName", e.target.value)
                                                }
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            >
                                                <option value="">選択してください</option>
                                                {equipmentOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.hours || ""}
                                                onChange={(e) =>
                                                    updateEquipment(row.id, "hours", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.unitPrice || ""}
                                                onChange={(e) =>
                                                    updateEquipment(row.id, "unitPrice", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <div className="px-3 py-2 bg-slate-50 rounded-lg text-right font-medium text-slate-700">
                                                ¥{row.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCompanyEquipment((prev) => prev.filter((r) => r.id !== row.id))
                                                }
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <button
                            type="button"
                            onClick={() =>
                                setCompanyEquipment((prev) => [
                                    ...prev,
                                    { id: generateId(), equipmentName: "", hours: 0, unitPrice: 0, amount: 0 },
                                ])
                            }
                            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            行を追加
                        </button>
                        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                            <Calculator className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-green-700">③自社機械経費計:</span>
                            <span className="text-lg font-bold text-green-700">
                                ¥{equipmentTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 材料費セクション */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-sm font-bold">
                            ②
                        </span>
                        材料費
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium">仕入先</th>
                                    <th className="pb-2 font-medium">材料名</th>
                                    <th className="pb-2 font-medium w-20">数量</th>
                                    <th className="pb-2 font-medium w-28">単価</th>
                                    <th className="pb-2 font-medium w-32">金額</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {materials.map((row) => (
                                    <tr key={row.id}>
                                        <td className="py-2">
                                            <input
                                                type="text"
                                                value={row.supplier}
                                                onChange={(e) => updateMaterial(row.id, "supplier", e.target.value)}
                                                placeholder="仕入先"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="text"
                                                value={row.materialName}
                                                onChange={(e) =>
                                                    updateMaterial(row.id, "materialName", e.target.value)
                                                }
                                                placeholder="材料名"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.quantity || ""}
                                                onChange={(e) =>
                                                    updateMaterial(row.id, "quantity", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.unitPrice || ""}
                                                onChange={(e) =>
                                                    updateMaterial(row.id, "unitPrice", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <div className="px-3 py-2 bg-slate-50 rounded-lg text-right font-medium text-slate-700">
                                                ¥{row.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setMaterials((prev) => prev.filter((r) => r.id !== row.id))
                                                }
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <button
                            type="button"
                            onClick={() =>
                                setMaterials((prev) => [
                                    ...prev,
                                    {
                                        id: generateId(),
                                        supplier: "",
                                        materialName: "",
                                        quantity: 0,
                                        unitPrice: 0,
                                        amount: 0,
                                    },
                                ])
                            }
                            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            行を追加
                        </button>
                        <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
                            <Calculator className="w-5 h-5 text-purple-600" />
                            <span className="text-sm text-purple-700">②材料費計:</span>
                            <span className="text-lg font-bold text-purple-700">
                                ¥{materialTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* リース機械セクション */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-sm font-bold">
                            ④
                        </span>
                        リース機械等
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium">借入先</th>
                                    <th className="pb-2 font-medium">機械名</th>
                                    <th className="pb-2 font-medium w-20">時間</th>
                                    <th className="pb-2 font-medium w-28">単価</th>
                                    <th className="pb-2 font-medium w-32">金額</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {leasedEquipment.map((row) => (
                                    <tr key={row.id}>
                                        <td className="py-2">
                                            <input
                                                type="text"
                                                value={row.lender}
                                                onChange={(e) => updateLeased(row.id, "lender", e.target.value)}
                                                placeholder="借入先"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="text"
                                                value={row.equipmentName}
                                                onChange={(e) =>
                                                    updateLeased(row.id, "equipmentName", e.target.value)
                                                }
                                                placeholder="機械名"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.hours || ""}
                                                onChange={(e) =>
                                                    updateLeased(row.id, "hours", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.unitPrice || ""}
                                                onChange={(e) =>
                                                    updateLeased(row.id, "unitPrice", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <div className="px-3 py-2 bg-slate-50 rounded-lg text-right font-medium text-slate-700">
                                                ¥{row.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setLeasedEquipment((prev) => prev.filter((r) => r.id !== row.id))
                                                }
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <button
                            type="button"
                            onClick={() =>
                                setLeasedEquipment((prev) => [
                                    ...prev,
                                    {
                                        id: generateId(),
                                        lender: "",
                                        equipmentName: "",
                                        hours: 0,
                                        unitPrice: 0,
                                        amount: 0,
                                    },
                                ])
                            }
                            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            行を追加
                        </button>
                        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg">
                            <Calculator className="w-5 h-5 text-amber-600" />
                            <span className="text-sm text-amber-700">④リース機械等計:</span>
                            <span className="text-lg font-bold text-amber-700">
                                ¥{leasedTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 燃料費セクション */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-sm font-bold">
                            ⑤
                        </span>
                        燃料費
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium">品名</th>
                                    <th className="pb-2 font-medium">車番</th>
                                    <th className="pb-2 font-medium w-20">数量</th>
                                    <th className="pb-2 font-medium w-28">単価</th>
                                    <th className="pb-2 font-medium w-32">金額</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {fuelCosts.map((row) => (
                                    <tr key={row.id}>
                                        <td className="py-2">
                                            <select
                                                value={row.productName}
                                                onChange={(e) => updateFuel(row.id, "productName", e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            >
                                                <option value="">選択してください</option>
                                                {fuelOptions.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="text"
                                                value={row.vehicleNumber}
                                                onChange={(e) =>
                                                    updateFuel(row.id, "vehicleNumber", e.target.value)
                                                }
                                                placeholder="例: 33-36"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={row.quantity || ""}
                                                onChange={(e) =>
                                                    updateFuel(row.id, "quantity", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.unitPrice || ""}
                                                onChange={(e) =>
                                                    updateFuel(row.id, "unitPrice", parseFloat(e.target.value) || 0)
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <div className="px-3 py-2 bg-slate-50 rounded-lg text-right font-medium text-slate-700">
                                                ¥{row.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFuelCosts((prev) => prev.filter((r) => r.id !== row.id))
                                                }
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <button
                            type="button"
                            onClick={() =>
                                setFuelCosts((prev) => [
                                    ...prev,
                                    {
                                        id: generateId(),
                                        productName: "",
                                        vehicleNumber: "",
                                        quantity: 0,
                                        unitPrice: 0,
                                        amount: 0,
                                    },
                                ])
                            }
                            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            行を追加
                        </button>
                        <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
                            <Calculator className="w-5 h-5 text-red-600" />
                            <span className="text-sm text-red-700">⑤燃料費計:</span>
                            <span className="text-lg font-bold text-red-700">
                                ¥{fuelTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 作業内容セクション */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-600 text-sm font-bold">
                            📝
                        </span>
                        作業内容
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                補修
                            </label>
                            <textarea
                                value={repairContent}
                                onChange={(e) => setRepairContent(e.target.value)}
                                placeholder="補修作業の内容"
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                現場片付け
                            </label>
                            <textarea
                                value={cleanupContent}
                                onChange={(e) => setCleanupContent(e.target.value)}
                                placeholder="現場片付けの内容"
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                作業内容
                            </label>
                            <textarea
                                value={workContent}
                                onChange={(e) => setWorkContent(e.target.value)}
                                placeholder="本日の作業内容を詳しく記入してください"
                                rows={5}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 外注セクション */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">
                            外
                        </span>
                        外注
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium">《外注》社名</th>
                                    <th className="pb-2 font-medium w-20">人数</th>
                                    <th className="pb-2 font-medium">名前</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {subcontractors.map((row) => (
                                    <tr key={row.id}>
                                        <td className="py-2">
                                            <input
                                                type="text"
                                                value={row.companyName}
                                                onChange={(e) =>
                                                    updateSubcontractor(row.id, "companyName", e.target.value)
                                                }
                                                placeholder="社名"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={row.workerCount || ""}
                                                onChange={(e) =>
                                                    updateSubcontractor(
                                                        row.id,
                                                        "workerCount",
                                                        parseInt(e.target.value) || 0
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="text"
                                                value={row.workerName}
                                                onChange={(e) =>
                                                    updateSubcontractor(row.id, "workerName", e.target.value)
                                                }
                                                placeholder="作業員名"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSubcontractors((prev) => prev.filter((r) => r.id !== row.id))
                                                }
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            setSubcontractors((prev) => [
                                ...prev,
                                { id: generateId(), companyName: "", workerCount: 0, workerName: "" },
                            ])
                        }
                        className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm mt-4"
                    >
                        <Plus className="w-4 h-4" />
                        行を追加
                    </button>
                </div>
            </div>

            {/* 固定フッター */}
            <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        合計:{" "}
                        <span className="font-bold text-slate-800">
                            ¥
                            {(
                                laborTotal +
                                equipmentTotal +
                                materialTotal +
                                leasedTotal +
                                fuelTotal
                            ).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => handleSubmit(true)}
                            disabled={saving || submitting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "保存中..." : "一時保存"}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit(false)}
                            disabled={saving || submitting || !projectName || !reporterName}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            {submitting ? "提出中..." : "提出する"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
