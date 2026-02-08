'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
    Home,
    FileText,
    Plus,
    Search,
    Settings,
    Users,
    Wrench,
    Building,
    LogOut,
    Menu,
    X
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
    { name: 'ダッシュボード', href: '/', icon: Home },
    { name: '日報作成', href: '/reports/new', icon: Plus },
    { name: '日報一覧', href: '/reports', icon: FileText },
]

const masterNavigation = [
    { name: '工事マスタ', href: '/master/projects', icon: Building },
    { name: '作業員マスタ', href: '/master/workers', icon: Users },
    { name: '機械マスタ', href: '/master/equipment', icon: Wrench },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const isAdmin = session?.user?.role === 'admin'
    const isManager = session?.user?.role === 'manager' || isAdmin

    return (
        <>
            {/* モバイルメニューボタン */}
            <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white shadow-lg"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* モバイルオーバーレイ */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* サイドバー */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-slate-900 to-slate-800 
        border-r border-slate-700/50
        transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
                {/* ヘッダー */}
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">工事日報</h1>
                                <p className="text-xs text-slate-400">ダイユウ建設</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="lg:hidden p-1 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ナビゲーション */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                        メイン
                    </p>
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all
                  ${isActive
                                        ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 shadow-lg shadow-orange-500/10'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }
                `}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : ''}`} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        )
                    })}

                    {isManager && (
                        <>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2">
                                マスタ管理
                            </p>
                            {masterNavigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`
                      flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all
                      ${isActive
                                                ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 shadow-lg shadow-orange-500/10'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                            }
                    `}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : ''}`} />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                )
                            })}
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2">
                                システム管理
                            </p>
                            <Link
                                href="/admin/users"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all
                  ${pathname === '/admin/users'
                                        ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }
                `}
                            >
                                <Settings className="w-5 h-5" />
                                <span className="font-medium">ユーザー管理</span>
                            </Link>
                        </>
                    )}
                </nav>

                {/* ユーザー情報 */}
                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{session?.user?.name || 'ゲスト'}</p>
                                <p className="text-xs text-slate-500 capitalize">{session?.user?.role || ''}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">ログアウト</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
