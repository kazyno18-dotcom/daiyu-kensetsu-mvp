'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Application Error:', error)
    }, [error])

    // エラーメッセージからデータベース関連か判定
    const isDbError = error.message.includes('DATABASE_URL') || error.message.includes('Prisma');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 border border-red-100">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                    システムエラーが発生しました
                </h2>

                <p className="text-gray-600 text-center mb-6 text-sm">
                    予期せぬエラーによりページの表示に失敗しました。
                    <br />
                    再読み込みを行っても解消しない場合は、管理者へご連絡ください。
                </p>

                <div className="bg-slate-50 rounded p-4 mb-6 overflow-hidden">
                    <p className="text-xs font-mono text-slate-500 mb-1">Error Details:</p>
                    <p className="text-xs font-mono text-red-600 break-all">{error.message}</p>
                    {error.digest && (
                        <p className="text-xs font-mono text-slate-400 mt-1">ID: {error.digest}</p>
                    )}

                    {isDbError && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs font-bold text-slate-700">診断ヒント:</p>
                            <p className="text-xs text-slate-600 mt-1">
                                データベース接続設定(DATABASE_URL)が読み込めていない可能性があります。
                                Vercelの環境変数設定を確認してください。
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => reset()}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                >
                    再読み込みを実行
                </button>
            </div>
        </div>
    )
}
