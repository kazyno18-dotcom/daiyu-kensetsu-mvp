'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
        <html>
            <body>
                <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
                    <h2>Application Error (Global)</h2>
                    <p>エラーが発生しました。</p>
                    <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', margin: '10px 0' }}>
                        <p><strong>Message:</strong> {error.message}</p>
                        <p><strong>Digest:</strong> {error.digest}</p>
                        <pre style={{ overflow: 'auto' }}>{error.stack}</pre>
                    </div>
                    <button onClick={() => reset()}>Try again</button>
                </div>
            </body>
        </html>
    )
}
