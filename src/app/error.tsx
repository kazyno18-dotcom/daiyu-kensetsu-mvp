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

    // クライアントサイドでもenvの一部を見せる（デバッグ用）
    // 注意: 通常、サーバーサイドの環境変数はクライアントには漏れないが、
    // エラーオブジェクトに含まれているか、あるいはサーバーコンポーネントから渡される必要がある。
    // ここではerror.message自体に情報が含まれていることを期待。

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <div className="max-w-2xl w-full bg-white shadow-xl rounded-2xl p-8 border border-red-100">
                <div className="flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mx-auto mb-6 ring-8 ring-red-50/50">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    システムエラーが発生しました
                </h2>

                <p className="text-gray-500 text-center mb-8">
                    予期せぬエラーにより、リクエストを処理できませんでした。<br />
                    以下の技術情報を開発者にお伝えください。
                </p>

                <div className="bg-slate-900 rounded-xl p-6 mb-8 overflow-hidden shadow-inner">
                    <div className="flex items-center space-x-2 mb-4 border-b border-slate-700 pb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs text-slate-400 ml-2">Console Output</span>
                    </div>

                    <code className="block font-mono text-sm text-red-400 break-all leading-relaxed">
                        {error.message}
                    </code>

                    {error.digest && (
                        <p className="text-xs font-mono text-slate-500 mt-4">Digest ID: {error.digest}</p>
                    )}

                    {isDbError && (
                        <div className="mt-6 pt-4 border-t border-slate-700/50">
                            <p className="text-xs font-bold text-yellow-400 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                トラブルシューティング・ヒント
                            </p>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                データベース接続 URL (DATABASE_URL) が読み込まれていません。<br />
                                Vercelの <strong>Settings &gt; Environment Variables</strong> を確認し、
                                <code>DATABASE_URL</code> が正しく設定されているか確認してください。
                                また、<strong>Automatically expose System Environment Variables</strong> が有効になっているかも確認してください。
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex-1 bg-white hover:bg-gray-50 text-slate-700 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-all duration-200 shadow-sm hover:shadow"
                    >
                        トップページへ戻る
                    </button>
                    <button
                        onClick={() => reset()}
                        className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        再読み込み
                    </button>
                </div>
            </div>
        </div>
    )
}
