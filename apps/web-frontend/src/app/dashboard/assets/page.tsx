'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Asset } from '@/lib/api';

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAssets();
    }, []);

    async function loadAssets() {
        setLoading(true);
        const response = await api.assets.list();
        if (response.error) {
            setError(response.message || response.error);
        } else if (response.data) {
            // The API returns a paginated object { items, total, etc }
            const data = response.data as any;
            setAssets(data.items || []);
        }
        setLoading(false);
    }

    return (
        <main style={{ minHeight: '100vh', padding: '2rem' }}>
            <header className="container header">
                <div>
                    <h1 className="logo">Asset Management</h1>
                    <p className="tagline">Track and manage company systems and peripherals</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/" className="btn" style={{ background: 'var(--bg-secondary)' }}>
                        ← Back
                    </Link>
                    <button className="btn btn-primary" onClick={loadAssets}>
                        Refresh Data
                    </button>
                </div>
            </header>

            <section className="container section glass" style={{ marginTop: '2rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="feature-dot" style={{ margin: '0 auto 1rem', width: '2rem', height: '2rem' }}></div>
                        <p>Loading assets from local database...</p>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: '#ff4444', marginBottom: '1rem' }}>Error: {error}</p>
                        {error.toLowerCase().includes('sign in') || error.toLowerCase().includes('unauthorized') ? (
                            <Link href="/api/auth/signin" className="btn btn-primary">
                                Sign In Now
                            </Link>
                        ) : (
                            <button className="btn btn-primary" onClick={loadAssets}>
                                Try Again
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '1rem' }}>Asset ID</th>
                                    <th style={{ padding: '1rem' }}>Type</th>
                                    <th style={{ padding: '1rem' }}>Manufacturer / Model</th>
                                    <th style={{ padding: '1rem' }}>Serial No</th>
                                    <th style={{ padding: '1rem' }}>RAM / Storage</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No assets found. Ensure the SQL script was run and the backend is active.
                                        </td>
                                    </tr>
                                ) : (
                                    assets.map((asset) => (
                                        <tr key={asset.id} className="card-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{asset.asset_id}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '1rem',
                                                    background: asset.asset_class === 'System' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                                    color: asset.asset_class === 'System' ? '#60a5fa' : '#a78bfa'
                                                }}>
                                                    {asset.asset_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {asset.manufacturer} {asset.model !== 'N/A' ? asset.model : ''}
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {asset.serial_number}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                {asset.ram_size_gb ? `${asset.ram_size_gb}GB / ` : ''}
                                                {asset.hard_drive_size !== 'N/A' ? asset.hard_drive_size : '-'}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    color: asset.status === 'active' ? '#4ade80' : '#fbbf24',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: asset.status === 'active' ? '#4ade80' : '#fbbf24'
                                                    }}></span>
                                                    {asset.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <footer className="container" style={{ marginTop: '2rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Total Assets Connected: {assets.length}
            </footer>
        </main>
    );
}
