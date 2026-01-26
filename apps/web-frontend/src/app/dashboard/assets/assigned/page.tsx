'use client';

import { useState, useEffect } from 'react';
import { api, Asset, Employee } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AssetWithEmployee extends Asset {
    employee?: Employee | null;
}

export default function AssignedAssetsPage() {
    const [assets, setAssets] = useState<AssetWithEmployee[]>([]);
    const [employees, setEmployees] = useState<Map<number, Employee>>(new Map());
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 20;

    useEffect(() => {
        loadData();
    }, [page]);

    async function loadData() {
        setLoading(true);
        try {
            // Fetch assigned assets and all employees in parallel
            const [assetsRes, employeesRes] = await Promise.all([
                api.assets.listAssigned(page, pageSize),
                api.employees.list()
            ]);

            const empMap = new Map<number, Employee>();
            if (employeesRes.data) {
                employeesRes.data.items.forEach(emp => empMap.set(emp.id, emp));
                setEmployees(empMap);
            }

            if (assetsRes.data) {
                const assignedAssets = assetsRes.data.items.map(asset => ({
                    ...asset,
                    employee: asset.assigned_employee_id ? empMap.get(asset.assigned_employee_id) || null : null
                }));
                setAssets(assignedAssets);
                setTotalPages(assetsRes.data.pages);
            }
        } catch (err) {
            console.error('Failed to load assigned assets', err);
        } finally {
            setLoading(false);
        }
    }

    function getAssetIcon(assetType?: string) {
        const icons: Record<string, string> = {
            'Laptop': '💻',
            'Desktop': '🖥️',
            'Monitor': '🖵',
            'Mouse': '🖱️',
            'Keyboard': '⌨️',
            'Headset': '🎧',
            'Printer': '🖨️',
            'Router': '📡',
            'Mac Mini': '🍎',
            'Docking Station': '🔌',
            'Webcam': '📷',
        };
        return icons[assetType || ''] || '📦';
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Assigned Assets</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Track company assets currently deployed to employees
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link
                        href="/dashboard/assets/assigned/new"
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px',
                            background: 'var(--primary)', color: 'white',
                            textDecoration: 'none', fontWeight: 600,
                            fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <span>+</span> New Assignment
                    </Link>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                        Total Assigned: {assets.length}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{
                            width: '40px', height: '40px', border: '3px solid var(--border-color)',
                            borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <p style={{ color: 'var(--text-secondary)' }}>Loading asset data...</p>
                    </div>
                ) : assets.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Assets Assigned</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>All assets are currently in stock or maintenance.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ASSET</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ASSIGNED TO</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DETAILS</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map(asset => (
                                <tr key={asset.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '44px', height: '44px',
                                                background: 'var(--bg-secondary)', borderRadius: '10px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.5rem'
                                            }}>
                                                {getAssetIcon(asset.asset_type)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.asset_id}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{asset.asset_type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {asset.employee ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontWeight: 600, fontSize: '0.9rem'
                                                }}>
                                                    {asset.employee.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{asset.employee.full_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{asset.employee.email}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                Check ID: {asset.assigned_employee_id}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontSize: '0.9rem' }}>{asset.manufacturer} {asset.model}</div>
                                        <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                            SN: {asset.serial_number || 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <Link
                                            href={`/dashboard/assets/${asset.id}`}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.5rem 1rem', borderRadius: '6px',
                                                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                                color: 'var(--text-primary)', textDecoration: 'none',
                                                fontSize: '0.85rem', fontWeight: 500
                                            }}
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '0.5rem' }}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="btn"
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        Previous
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="btn"
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
