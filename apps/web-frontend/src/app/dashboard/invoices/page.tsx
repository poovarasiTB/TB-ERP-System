'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Invoice } from '@/lib/api';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadInvoices();
    }, []);

    async function loadInvoices() {
        setLoading(true);
        const response = await api.invoices.list();
        if (response.error) {
            setError(response.message || response.error);
        } else if (response.data) {
            const data = response.data as any;
            setInvoices(data.items || []);
        }
        setLoading(false);
    }

    return (
        <main style={{ minHeight: '100vh', padding: '2rem' }}>
            <header className="container header">
                <div>
                    <h1 className="logo">Invoices</h1>
                    <p className="tagline">Billing, payments, and financial records</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/" className="btn" style={{ background: 'var(--bg-secondary)' }}>
                        ← Back
                    </Link>
                    <button className="btn btn-primary" onClick={loadInvoices}>
                        Refresh
                    </button>
                </div>
            </header>

            <section className="container section glass" style={{ marginTop: '2rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="feature-dot" style={{ margin: '0 auto 1rem', width: '2rem', height: '2rem' }}></div>
                        <p>Loading financial data...</p>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: '#ff4444', marginBottom: '1rem' }}>Error: {error}</p>
                        {error.toLowerCase().includes('sign in') || error.toLowerCase().includes('unauthorized') ? (
                            <Link href="/api/auth/signin" className="btn btn-primary">
                                Sign In Now
                            </Link>
                        ) : (
                            <button className="btn btn-primary" onClick={loadInvoices}>
                                Try Again
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
                            <div className="glass card-hover" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <h4 style={{ opacity: 0.7 }}>Total Revenue</h4>
                                <h2 style={{ color: 'var(--accent-primary)' }}>
                                    ₹{invoices.reduce((sum, inv) => sum + inv.total_amount, 0).toLocaleString()}
                                </h2>
                            </div>
                            <div className="glass card-hover" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <h4 style={{ opacity: 0.7 }}>Invoice Count</h4>
                                <h2 style={{ color: 'var(--accent-secondary)' }}>{invoices.length}</h2>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '1rem' }}>Invoice #</th>
                                    <th style={{ padding: '1rem' }}>Amount</th>
                                    <th style={{ padding: '1rem' }}>Due Date</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No invoices found.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.id} className="card-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{inv.invoice_number}</td>
                                            <td style={{ padding: '1rem' }}>₹{inv.total_amount.toLocaleString()}</td>
                                            <td style={{ padding: '1rem', opacity: 0.7 }}>{inv.due_date || 'N/A'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    color: '#fbbf24',
                                                    border: '1px solid rgba(251, 191, 36, 0.3)',
                                                    padding: '0.1rem 0.5rem',
                                                    borderRadius: '0.2rem',
                                                    fontSize: '0.8rem'
                                                }}>{inv.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
