'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, Asset } from '@/lib/api';

export default function AssetsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get('status') || '';
    const typeFilter = searchParams.get('type') || '';

    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadAssets();
    }, [search, statusFilter, typeFilter]);

    async function loadAssets() {
        setLoading(true);
        // api.assets.list handles search parameter if provided
        const response = await api.assets.list(1, 20, typeFilter || undefined, undefined, search, statusFilter || undefined);
        if (response.error) {
            setError(response.message || response.error);
        } else if (response.data) {
            const data = response.data as any;
            setAssets(data.items || []);
        }
        setLoading(false);
    }

    const handleStatusChange = (newStatus: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newStatus) {
            params.set('status', newStatus);
        } else {
            params.delete('status');
        }
        router.push(`/dashboard/assets?${params.toString()}`);
    };

    return (
        <div>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Asset Management</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track and manage company systems and peripherals</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                minWidth: '300px'
                            }}
                        />
                        <svg
                            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>

                    <Link href="/dashboard/assets/add" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Asset
                    </Link>
                </div>
            </header>

            <section className="card">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="feature-dot" style={{ margin: '0 auto 1rem', width: '2rem', height: '2rem' }}></div>
                        <p style={{ color: 'var(--text-secondary)' }}>Loading assets...</p>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: '#ff4444', marginBottom: '1rem' }}>Error: {error}</p>
                        <button className="btn btn-primary" onClick={loadAssets}>Try Again</button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>ASSET ID</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>TYPE</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>MODEL</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>SERIAL</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            STATUS
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => handleStatusChange(e.target.value)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'inherit',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    padding: '2px',
                                                    outline: 'none',
                                                    borderBottom: '1px dashed var(--border-color)'
                                                }}
                                            >
                                                <option value="">All</option>
                                                <option value="active">Active</option>
                                                <option value="assigned">Assigned</option>
                                                <option value="maintenance">Maint.</option>
                                                <option value="retired">Retired</option>
                                            </select>
                                        </div>
                                    </th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            <div style={{ marginBottom: '1rem', fontSize: '2rem', opacity: 0.5 }}>📦</div>
                                            <p>No matching assets found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    assets.map((asset) => (
                                        <tr key={asset.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>
                                                <Link href={`/dashboard/assets/${asset.id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-blue-600">
                                                    {asset.asset_id}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '1rem',
                                                    background: asset.asset_class === 'System' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                                    color: asset.asset_class === 'System' ? '#3b82f6' : '#6b7280',
                                                    fontWeight: 500
                                                }}>
                                                    {asset.asset_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 500 }}>{asset.model !== 'N/A' ? asset.model : asset.manufacturer}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{asset.manufacturer}</div>
                                            </td>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                                {asset.serial_number !== 'N/A' ? asset.serial_number : '-'}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    color: asset.status === 'active' ? '#10b981' : asset.status === 'assigned' ? '#3b82f6' : '#f59e0b',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontWeight: 500,
                                                    fontSize: '0.875rem'
                                                }}>
                                                    <span style={{
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        background: asset.status === 'active' ? '#10b981' : asset.status === 'assigned' ? '#3b82f6' : '#f59e0b'
                                                    }}></span>
                                                    {asset.status.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <Link href={`/dashboard/assets/${asset.id}`} style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                    fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none',
                                                    padding: '0.25rem 0.5rem', borderRadius: '4px',
                                                    border: '1px solid var(--border-color)'
                                                }} className="hover:bg-gray-100">
                                                    Details →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
