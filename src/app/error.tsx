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
        console.error(error)
    }, [error])

    return (
        <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
            <h2>Application Error</h2>
            <p>ページ表示中にエラーが発生しました。</p>
            <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', margin: '10px 0' }}>
                <p><strong>Message:</strong> {error.message}</p>
                <p><strong>Digest:</strong> {error.digest}</p>
                <pre style={{ overflow: 'auto' }}>{error.stack}</pre>
            </div>
            <button
                onClick={() => reset()}
                style={{ padding: '8px 16px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px' }}
            >
                再試行
            </button>
        </div>
    )
}
