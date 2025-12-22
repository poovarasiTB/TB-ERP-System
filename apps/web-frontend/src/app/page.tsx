'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
    const { data: session, status } = useSession();

    return (
        <main style={{ minHeight: '100vh', padding: '2rem' }}>
            <header className="container header">
                <div>
                    <h1 className="logo">TB ERP System</h1>
                    <p className="tagline">Enterprise Resource Planning - Unified Management Platform</p>
                </div>
                {status === 'loading' ? (
                    <div className="btn" style={{ opacity: 0.5 }}>Loading...</div>
                ) : session ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            Welcome, <strong>{session.user?.name || 'User'}</strong>
                        </span>
                        <button onClick={() => signOut()} className="btn" style={{ background: 'var(--bg-secondary)' }}>
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <Link href="/auth/signin" className="btn btn-primary">
                        Sign In →
                    </Link>
                )}
            </header>

            <section className="container" style={{ marginTop: '2rem' }}>
                <div className="grid grid-cols-4">
                    <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                        <div className="module-card blue">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                            </svg>
                            <h3>Dashboard</h3>
                            <p>Overview of all business metrics and KPIs</p>
                        </div>
                    </Link>

                    <Link href="/dashboard/assets" style={{ textDecoration: 'none' }}>
                        <div className="module-card green">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M5 21V10.85M19 21V10.85" />
                            </svg>
                            <h3>Asset Management</h3>
                            <p>Track and manage company systems and hardware</p>
                        </div>
                    </Link>

                    <Link href="/dashboard/invoices" style={{ textDecoration: 'none' }}>
                        <div className="module-card amber">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                            </svg>
                            <h3>Invoices</h3>
                            <p>Billing, payments, and financial records</p>
                        </div>
                    </Link>

                    <Link href="/dashboard/employees" style={{ textDecoration: 'none' }}>
                        <div className="module-card purple">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h3>Staff Directory</h3>
                            <p>Manage employees and organizational structure</p>
                        </div>
                    </Link>
                </div>
            </section>

            <section className="container section glass" style={{ marginTop: '3rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Architecture Highlights</h2>
                <div className="grid grid-cols-3">
                    <div className="feature-item">
                        <div className="feature-dot" />
                        <div>
                            <h4>Microservices</h4>
                            <p>FastAPI services with logical schema isolation</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <div className="feature-dot" />
                        <div>
                            <h4>Next.js BFF</h4>
                            <p>Unified interface with secure proxy routing</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <div className="feature-dot" />
                        <div>
                            <h4>Local Postgres</h4>
                            <p>High performance with Docker-free development</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="container" style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <p>TB ERP System © 2024 • Development Mode Active</p>
            </footer>
        </main>
    );
}
