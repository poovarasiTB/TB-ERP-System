'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '1.5rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ width: '3rem', height: '3rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '1rem' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Authentication Error</h1>
                    <p className="tagline" style={{ color: '#ef4444' }}>{error || 'An error occurred during sign in'}</p>
                </div>

                <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '2rem' }}>
                    Please check your credentials and ensure the backend services are running.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Link href="/auth/signin" className="btn btn-primary">
                        Try Again
                    </Link>
                    <Link href="/" style={{ fontSize: '0.85rem', opacity: 0.6, color: 'white', textDecoration: 'none' }}>
                        Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
