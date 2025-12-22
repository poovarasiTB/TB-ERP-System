'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Employee } from '@/lib/api';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadEmployees();
    }, []);

    async function loadEmployees() {
        setLoading(true);
        const response = await api.employees.list();
        if (response.error) {
            setError(response.message || response.error);
        } else if (response.data) {
            const data = response.data as any;
            setEmployees(data.items || []);
        }
        setLoading(false);
    }

    return (
        <main style={{ minHeight: '100vh', padding: '2rem' }}>
            <header className="container header">
                <div>
                    <h1 className="logo">Employee Directory</h1>
                    <p className="tagline">Manage organizational structure and staff details</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/" className="btn" style={{ background: 'var(--bg-secondary)' }}>
                        ← Back
                    </Link>
                    <button className="btn btn-primary" onClick={loadEmployees}>
                        Refresh
                    </button>
                </div>
            </header>

            <section className="container section glass" style={{ marginTop: '2rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="feature-dot" style={{ margin: '0 auto 1rem', width: '2rem', height: '2rem' }}></div>
                        <p>Fetching employee data...</p>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: '#ff4444', marginBottom: '1rem' }}>Error: {error}</p>
                        {error.toLowerCase().includes('sign in') || error.toLowerCase().includes('unauthorized') ? (
                            <Link href="/api/auth/signin" className="btn btn-primary">
                                Sign In Now
                            </Link>
                        ) : (
                            <button className="btn btn-primary" onClick={loadEmployees}>
                                Try Again
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
                        {employees.length === 0 ? (
                            <p style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                No employees found.
                            </p>
                        ) : (
                            employees.map((emp) => (
                                <div key={emp.id} className="module-card purple" style={{ display: 'block' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{emp.employee_id}</span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            background: emp.is_active ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: emp.is_active ? '#4ade80' : '#ef4444',
                                            padding: '0.1rem 0.5rem',
                                            borderRadius: '1rem'
                                        }}>
                                            {emp.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: '0.5rem 0' }}>{emp.full_name}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                        {emp.email}
                                    </p>
                                    <div style={{ fontSize: '0.8rem', display: 'flex', gap: '1rem', opacity: 0.8 }}>
                                        <span>📍 {emp.location || 'N/A'}</span>
                                        <span>🏢 Dept: {emp.department_id || 'N/A'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            <footer className="container" style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Total Staff: {employees.length}
            </footer>
        </main>
    );
}
