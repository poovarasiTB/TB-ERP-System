'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, DashboardStats, EmployeeUsage } from '@/lib/api';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export default function AssetDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [employeeUsage, setEmployeeUsage] = useState<EmployeeUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [employeeSearch, setEmployeeSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [statsRes, usageRes] = await Promise.all([
                api.analytics.getDashboardStats(),
                api.analytics.getEmployeeUsage()
            ]);

            if (statsRes.data) setStats(statsRes.data);
            if (usageRes.data) setEmployeeUsage(usageRes.data);
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !stats) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{
                    width: '40px', height: '40px', border: '3px solid var(--border-color)',
                    borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem',
                    animation: 'spin 1s linear infinite'
                }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
            </div>
        );
    }

    // Chart Data Helpers
    const statusLabels = Object.keys(stats.status_distribution);
    const statusData = {
        labels: statusLabels.map(s => s.replace('_', ' ').toUpperCase()),
        datasets: [
            {
                data: Object.values(stats.status_distribution),
                backgroundColor: [
                    '#10b981', // active/in_stock - Green
                    '#3b82f6', // assigned - Blue
                    '#f59e0b', // maintenance - Amber
                    '#ef4444', // retired - Red
                    '#8b5cf6', // other - Purple
                ],
                borderWidth: 0,
            },
        ],
    };

    const typeLabels = Object.keys(stats.type_distribution);
    const typeData = {
        labels: typeLabels,
        datasets: [
            {
                label: 'Count',
                data: Object.values(stats.type_distribution),
                backgroundColor: '#3b82f6',
                borderRadius: 4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { color: '#9ca3af', usePointStyle: true, pointStyle: 'circle' }
            }
        },
        cutout: '70%', // For Doughnut thickness
        onClick: (event: any, elements: any[]) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const status = statusLabels[index];
                router.push(`/dashboard/assets?status=${status}`);
            }
        }
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af' }
            }
        },
        onClick: (event: any, elements: any[]) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const type = typeLabels[index];
                router.push(`/dashboard/assets?type=${type}`);
            }
        }
    };

    const handleCardClick = (status?: string) => {
        const url = status ? `/dashboard/assets?status=${status}` : '/dashboard/assets';
        router.push(url);
    };

    const filteredEmployees = employeeUsage.filter(emp =>
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.code.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Home / Asset Management / Dashboard
                </div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Asset Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Dashboard of company asset status and assignments.</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Assets', value: stats.total_assets, color: '#3b82f6', status: '' },
                    { label: 'Assigned Assets', value: stats.assigned_assets, color: '#10b981', status: 'assigned' },
                    { label: 'Available Assets', value: stats.available_assets, color: '#f59e0b', status: 'active' },
                    { label: 'Under Maintenance', value: stats.maintenance_assets, color: '#ef4444', status: 'maintenance' },
                ].map((card, i) => (
                    <div
                        key={i}
                        className="card kpi-card"
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onClick={() => handleCardClick(card.status)}
                    >
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            {card.label}
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {card.value}
                        </div>
                        <style jsx>{`
                            .kpi-card:hover {
                                transform: translateY(-4px);
                                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                                border-color: var(--primary);
                            }
                        `}</style>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Asset Status Distribution</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                        <Doughnut data={statusData} options={chartOptions} />
                    </div>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Assets by Category</h3>
                    <div style={{ height: '300px', cursor: 'pointer' }}>
                        <Bar data={typeData} options={barOptions} />
                    </div>
                </div>
            </div>

            {/* Employee Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Assets by Employee</h3>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search by employee..."
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                padding: '0.5rem 1rem 0.5rem 2.5rem',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem'
                            }}
                        />
                        <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>Employee Name</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>Employee Code</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>Email</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>Assigned Assets</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No assignments found.</td>
                                </tr>
                            ) : (
                                filteredEmployees.slice(0, 10).map((emp) => ( // Show top 10
                                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{emp.name}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{emp.code || 'N/A'}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{emp.email}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{emp.assigned_assets}</td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <Link
                                                href={`/dashboard/assets?search=${emp.name}`}
                                                style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.8rem' }}
                                            >
                                                View Details &gt;
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
