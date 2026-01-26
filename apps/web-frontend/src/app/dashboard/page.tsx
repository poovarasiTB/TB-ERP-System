'use client';

import Link from 'next/link';

export default function DashboardGlobalScreen() {
    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Select an application to launch</p>
            </div>

            <div className="grid grid-cols-4">
                <Link href="/dashboard/assets/overview" style={{ textDecoration: 'none' }}>
                    <div className="module-card blue" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{
                                width: '48px', height: '48px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1rem'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M5 21V10.85M19 21V10.85" />
                                </svg>
                            </div>
                            <h3>Asset Management</h3>
                            <p style={{ marginTop: '0.5rem', opacity: 0.9, lineHeight: 1.5 }}>
                                Track hardware, assignments, and lifecycle status.
                            </p>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            Launch App <span>→</span>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/invoices" style={{ textDecoration: 'none' }}>
                    <div className="module-card amber" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{
                                width: '48px', height: '48px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1rem'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                </svg>
                            </div>
                            <h3>Invoices</h3>
                            <p style={{ marginTop: '0.5rem', opacity: 0.9, lineHeight: 1.5 }}>
                                Manage billing, payments, and financial records.
                            </p>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            Launch App <span>→</span>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/employees" style={{ textDecoration: 'none' }}>
                    <div className="module-card purple" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{
                                width: '48px', height: '48px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1rem'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h3>Employees</h3>
                            <p style={{ marginTop: '0.5rem', opacity: 0.9, lineHeight: 1.5 }}>
                                Directory, department management, and roles.
                            </p>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            Launch App <span>→</span>
                        </div>
                    </div>
                </Link>

                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500 }}>Add Module</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Coming Soon</p>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>System Status</h3>
                <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Asset Service</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                            <span style={{ fontWeight: 600 }}>Operational</span>
                        </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Invoice Service</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                            <span style={{ fontWeight: 600 }}>Operational</span>
                        </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Employee Service</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                            <span style={{ fontWeight: 600 }}>Operational</span>
                        </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Database</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                            <span style={{ fontWeight: 600 }}>Connected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
