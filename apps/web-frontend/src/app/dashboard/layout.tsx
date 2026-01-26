'use client';
import { useSession, signOut } from 'next-auth/react'; // Added signOut
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="feature-dot" style={{ margin: '0 auto 1rem', width: '2rem', height: '2rem' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading session...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // or redirect
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            {/* Minimal Top Bar for User Profile - Visible on all dashboard pages */}
            <header style={{
                height: '64px',
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem',
                position: 'sticky',
                top: 0,
                zIndex: 40
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '8px' }}></div>
                            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>TB ERP</span>
                        </div>
                    </Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{session.user?.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{session.user?.email}</p>
                    </div>
                    <div style={{
                        width: '36px', height: '36px',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold'
                    }}>
                        {session.user?.name?.[0] || 'U'}
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        title="Sign Out"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            color: '#ef4444',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            height: '36px'
                        }}
                        className="hover:bg-red-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Sign Out</span>
                    </button>
                </div>
            </header>

            <main style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
                {children}
            </main>
        </div>
    );
}
