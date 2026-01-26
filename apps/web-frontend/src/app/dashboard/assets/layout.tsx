'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AssetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        {
            name: 'Dashboard', href: '/dashboard/assets/overview', icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            )
        },
        {
            name: 'Assets', href: '/dashboard/assets', icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            )
        },
        {
            name: 'Assigned', href: '/dashboard/assets/assigned', icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
            )
        },
    ];

    return (
        <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Asset Sidebar */}
            <aside style={{
                width: '240px',
                flexShrink: 0
            }}>
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid var(--border-color)',
                    position: 'sticky',
                    top: '100px'
                }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Asset Menu
                    </h2>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.5rem',
                                    color: isActive(item.href) ? 'var(--primary)' : 'var(--text-secondary)',
                                    background: isActive(item.href) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    fontWeight: isActive(item.href) ? 600 : 400,
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span style={{ opacity: isActive(item.href) ? 1 : 0.7 }}>{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <Link href="/dashboard" style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: 'var(--text-secondary)', fontSize: '0.9rem',
                            textDecoration: 'none'
                        }}>
                            <span>←</span> Back to Apps
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}
