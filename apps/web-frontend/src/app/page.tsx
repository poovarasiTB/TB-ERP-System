'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        } else if (status === 'unauthenticated') {
            // Optional: Redirect immediately to signin, or show landing page
            router.push('/auth/signin');
        }
    }, [status, router]);

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div className="feature-dot" style={{ margin: '0 auto 1rem', width: '2rem', height: '2rem' }}></div>
                <h1 className="logo" style={{ fontSize: '2rem', marginBottom: '1rem' }}>TB ERP System</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {status === 'loading' ? 'Initializing...' : 'Redirecting...'}
                </p>

                {status === 'unauthenticated' && (
                    <div style={{ marginTop: '2rem' }}>
                        <Link href="/auth/signin" className="btn btn-primary">
                            Sign In Manually
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
