'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Asset, AssetHistory, MaintenanceLog, Employee } from '@/lib/api';
import Link from 'next/link';

interface AssetDetailWithEmployee extends Asset {
    assigned_employee?: Employee | null;
}

export default function AssetDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [asset, setAsset] = useState<AssetDetailWithEmployee | null>(null);
    const [history, setHistory] = useState<AssetHistory[]>([]);
    const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
    const [employees, setEmployees] = useState<Map<number, Employee>>(new Map());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'maintenance'>('overview');

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    async function loadData() {
        setLoading(true);
        try {
            const [assetRes, historyRes, maintenanceRes, employeesRes] = await Promise.all([
                api.assets.get(id),
                api.assets.getHistory(id),
                api.assets.getMaintenance(id),
                api.employees.list()
            ]);

            // Build employee map for quick lookup
            if (employeesRes.data) {
                const empMap = new Map<number, Employee>();
                employeesRes.data.items.forEach(emp => empMap.set(emp.id, emp));
                setEmployees(empMap);

                // Enrich asset with employee info
                if (assetRes.data) {
                    const enrichedAsset: AssetDetailWithEmployee = {
                        ...assetRes.data,
                        assigned_employee: assetRes.data.assigned_employee_id
                            ? empMap.get(assetRes.data.assigned_employee_id) || null
                            : null
                    };
                    setAsset(enrichedAsset);
                }
            } else if (assetRes.data) {
                setAsset(assetRes.data);
            }

            if (historyRes.data) setHistory(historyRes.data);
            if (maintenanceRes.data) setMaintenance(maintenanceRes.data);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function getStatusColor(status: string) {
        const colors: Record<string, { bg: string; text: string; glow: string }> = {
            'active': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', glow: '0 0 20px rgba(16, 185, 129, 0.3)' },
            'assigned': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', glow: '0 0 20px rgba(59, 130, 246, 0.3)' },
            'maintenance': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', glow: '0 0 20px rgba(245, 158, 11, 0.3)' },
            'in_stock': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', glow: '0 0 20px rgba(34, 197, 94, 0.3)' },
            'retired': { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', glow: '0 0 20px rgba(107, 114, 128, 0.3)' },
        };
        return colors[status] || colors['active'];
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

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid var(--border-color)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading asset details...</p>
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!asset) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '4rem',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🔍</div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Asset Not Found</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    The asset you're looking for doesn't exist or has been removed.
                </p>
                <Link
                    href="/dashboard/assets"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none' }}
                >
                    Back to Assets
                </Link>
            </div>
        );
    }

    const statusStyle = getStatusColor(asset.status);

    return (
        <div>
            {/* Hero Header */}
            <div style={{
                background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)',
                borderRadius: '20px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background decoration */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '300px',
                    height: '300px',
                    background: `radial-gradient(circle, ${statusStyle.text}15 0%, transparent 70%)`,
                    pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                        {/* Asset Icon */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            {getAssetIcon(asset.asset_type)}
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{asset.asset_id}</h1>
                                <span style={{
                                    padding: '0.35rem 1rem',
                                    borderRadius: '2rem',
                                    background: statusStyle.bg,
                                    color: statusStyle.text,
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    boxShadow: statusStyle.glow
                                }}>
                                    {asset.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
                                {asset.manufacturer} {asset.model}
                            </p>
                            <p style={{
                                color: 'var(--text-muted)',
                                fontSize: '0.9rem',
                                fontFamily: 'monospace',
                                marginTop: '0.5rem'
                            }}>
                                SN: {asset.serial_number || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className="btn"
                            style={{
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                        </button>
                        {asset.status !== 'assigned' && asset.status !== 'maintenance' && (
                            <Link
                                href={`/dashboard/assets/${id}/assign`}
                                className="btn btn-primary"
                                style={{
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                                Assign Asset
                            </Link>
                        )}
                        {asset.status === 'assigned' && (
                            <Link
                                href={`/dashboard/assets/${id}/return`}
                                className="btn"
                                style={{
                                    textDecoration: 'none',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    border: 'none',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 10 4 15 9 20" />
                                    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                                </svg>
                                Return Asset
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '2rem',
                background: 'var(--bg-card)',
                borderRadius: '12px 12px 0 0',
                padding: '0 1rem'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                        { key: 'overview', label: 'Dashboard', icon: '📋' },
                        { key: 'history', label: 'Assignment History', icon: '📜' },
                        { key: 'maintenance', label: 'Maintenance', icon: '🔧' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            style={{
                                padding: '1rem 1.5rem',
                                borderBottom: activeTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
                                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.key ? 600 : 400,
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                {activeTab === 'overview' && (
                    <>
                        {/* System Specifications */}
                        <div style={{ gridColumn: 'span 8' }} className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1.2rem'
                                }}>
                                    ⚙️
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>System Specifications</h3>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '1.25rem'
                            }}>
                                <SpecItem label="Asset Type" value={asset.asset_type} icon="📦" />
                                <SpecItem label="Asset Class" value={asset.asset_class} icon="🏷️" />
                                <SpecItem label="Manufacturer" value={asset.manufacturer} icon="🏭" />
                                <SpecItem label="Model" value={asset.model} icon="📱" />
                                <SpecItem label="Operating System" value={asset.os_installed} icon="💿" />
                                <SpecItem label="Processor" value={asset.processor} icon="🔲" />
                                <SpecItem label="RAM" value={asset.ram_size_gb ? `${asset.ram_size_gb} GB` : undefined} icon="🧠" />
                                <SpecItem label="Storage" value={asset.hard_drive_size} icon="💾" />
                                <SpecItem label="Battery Condition" value={asset.battery_condition} icon="🔋" highlight={asset.battery_condition === 'Good' ? 'success' : asset.battery_condition === 'Average' ? 'warning' : undefined} />
                                <SpecItem label="Serial Number" value={asset.serial_number} icon="🔢" mono />
                            </div>
                        </div>

                        {/* Current Assignment & Quick Info */}
                        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Current Assignment Card */}
                            <div className="card" style={{
                                background: asset.status === 'assigned'
                                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                                    : 'var(--bg-card)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        background: asset.status === 'assigned' ? '#3b82f6' : 'var(--bg-secondary)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: asset.status === 'assigned' ? 'white' : 'var(--text-secondary)',
                                        fontSize: '1rem'
                                    }}>
                                        👤
                                    </div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>
                                        Current Assignment
                                    </h3>
                                </div>

                                {asset.status === 'assigned' && asset.assigned_employee ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: 'var(--bg-card)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '1.25rem'
                                        }}>
                                            {asset.assigned_employee.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                                {asset.assigned_employee.full_name}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {asset.assigned_employee.email}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--text-muted)',
                                                marginTop: '0.25rem'
                                            }}>
                                                {asset.assigned_employee.location || 'No location'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '2rem',
                                        textAlign: 'center',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '12px',
                                        border: '2px dashed var(--border-color)'
                                    }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>👤</div>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                            Not currently assigned
                                        </p>
                                        {asset.status !== 'maintenance' && (
                                            <Link
                                                href={`/dashboard/assets/${id}/assign`}
                                                className="btn btn-primary"
                                                style={{ textDecoration: 'none', fontSize: '0.85rem' }}
                                            >
                                                Assign Now
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="card">
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    📊 Quick Stats
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <QuickStat
                                        label="Total Assignments"
                                        value={history.length.toString()}
                                        icon="📋"
                                    />
                                    <QuickStat
                                        label="Maintenance Records"
                                        value={maintenance.length.toString()}
                                        icon="🔧"
                                    />
                                    <QuickStat
                                        label="Created"
                                        value={new Date(asset.created_at).toLocaleDateString()}
                                        icon="📅"
                                    />
                                    <QuickStat
                                        label="Last Updated"
                                        value={new Date(asset.updated_at).toLocaleDateString()}
                                        icon="🔄"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'history' && (
                    <div style={{ gridColumn: 'span 12' }} className="card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1.2rem'
                                }}>
                                    📜
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Assignment History</h3>
                            </div>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '1rem',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)'
                            }}>
                                {history.length} record{history.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {history.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: '2px dashed var(--border-color)'
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
                                <p style={{ color: 'var(--text-secondary)' }}>No assignment history records found.</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    History will appear once the asset is assigned to an employee.
                                </p>
                            </div>
                        ) : (
                            <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-secondary)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DATE</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>STATUS</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>EMPLOYEE</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>NOTES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h, idx) => {
                                            const emp = h.employee_id ? employees.get(h.employee_id) : null;
                                            const isActive = !h.return_date;
                                            return (
                                                <tr
                                                    key={h.id}
                                                    style={{
                                                        borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none',
                                                        background: isActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                                                    }}
                                                >
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 500 }}>
                                                            {h.assigned_date ? new Date(h.assigned_date).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                        {h.return_date && (
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                → {new Date(h.return_date).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '1rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                                                            color: isActive ? '#3b82f6' : '#6b7280'
                                                        }}>
                                                            {isActive ? '● Active' : '○ Returned'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                background: emp ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'var(--bg-secondary)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                fontSize: '0.8rem'
                                                            }}>
                                                                {emp ? emp.full_name.charAt(0) : '?'}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 500 }}>{emp?.full_name || `Employee #${h.employee_id}`}</div>
                                                                {emp && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                                                        {h.notes || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No notes</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div style={{ gridColumn: 'span 12' }} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1.2rem'
                                }}>
                                    🔧
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Maintenance Logs</h3>
                            </div>
                            <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                                + Log Maintenance
                            </button>
                        </div>

                        {maintenance.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: '2px dashed var(--border-color)'
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🔧</div>
                                <p style={{ color: 'var(--text-secondary)' }}>No maintenance records found.</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Track repairs, upgrades, and routine maintenance here.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {maintenance.map((log) => (
                                    <div
                                        key={log.id}
                                        style={{
                                            padding: '1.25rem',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-color)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                <div style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '1.25rem'
                                                }}>
                                                    {log.maintenance_type.includes('Battery') ? '🔋' :
                                                        log.maintenance_type.includes('RAM') || log.maintenance_type.includes('Upgrade') ? '⬆️' :
                                                            log.maintenance_type.includes('Clean') ? '✨' :
                                                                log.maintenance_type.includes('OS') ? '💿' : '🔧'}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{log.maintenance_type}</h4>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                                        {log.description}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        <span>📅 {new Date(log.performed_at).toLocaleDateString()}</span>
                                                        {log.performed_by && <span>👤 {log.performed_by}</span>}
                                                        {log.next_maintenance && <span>⏰ Next: {new Date(log.next_maintenance).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            {log.cost !== undefined && log.cost !== null && (
                                                <div style={{
                                                    padding: '0.5rem 1rem',
                                                    background: log.cost > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                                    color: log.cost > 0 ? '#d97706' : '#22c55e',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {log.cost > 0 ? `₹${log.cost.toLocaleString()}` : 'Free'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function SpecItem({
    label,
    value,
    icon,
    highlight,
    mono
}: {
    label: string;
    value?: string;
    icon?: string;
    highlight?: 'success' | 'warning' | 'error';
    mono?: boolean;
}) {
    const highlightColors = {
        success: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
        warning: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
        error: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
    };
    const style = highlight ? highlightColors[highlight] : null;

    return (
        <div style={{
            padding: '1rem',
            background: style?.bg || 'var(--bg-secondary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
        }}>
            <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
            }}>
                {icon && <span>{icon}</span>}
                {label}
            </div>
            <div style={{
                fontWeight: 600,
                fontSize: '1rem',
                color: style?.text || 'var(--text-primary)',
                fontFamily: mono ? 'monospace' : 'inherit'
            }}>
                {value || 'N/A'}
            </div>
        </div>
    );
}

function QuickStat({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            background: 'var(--bg-secondary)',
            borderRadius: '8px'
        }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{icon}</span>
                {label}
            </span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    );
}
