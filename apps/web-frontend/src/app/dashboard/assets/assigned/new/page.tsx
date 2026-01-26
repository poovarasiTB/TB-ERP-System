'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Asset, Employee } from '@/lib/api';

export default function NewAssignmentPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        employee_id: '',
        asset_id: '',
        notes: '',
        assigned_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [empRes, assetRes] = await Promise.all([
                api.employees.list({ size: '1000' }), // Fetch all suitable for dropdown
                api.assets.list(1, 1000, undefined, undefined, undefined, 'in_stock') // Fetch available assets
            ]);

            if (empRes.data) {
                // Handle Pagination
                setEmployees(empRes.data.items || []);
            }

            if (assetRes.data) {
                // Asset list also paginated
                setAvailableAssets(assetRes.data.items || []);
            }

        } catch (err: any) {
            setError(err.message || 'Failed to load form data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        if (!formData.employee_id || !formData.asset_id) {
            setError('Please select both an employee and an asset');
            setSubmitting(false);
            return;
        }

        try {
            await api.assets.assign(formData.asset_id, {
                employee_id: parseInt(formData.employee_id),
                notes: formData.notes,
                assigned_date: formData.assigned_date
            });

            router.push('/dashboard/assets/assigned');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to assign asset');
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading assignment form...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>New Asset Assignment</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Assign an available asset to an employee.</p>
            </div>

            {error && (
                <div style={{
                    padding: '1rem', marginBottom: '1.5rem',
                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                    borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    {error}
                </div>
            )}

            <div className="card" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>

                    {/* Employee Selection */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Employee</label>
                        <select
                            value={formData.employee_id}
                            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)', color: 'var(--text-primary)'
                            }}
                            required
                        >
                            <option value="">-- Choose Employee --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.full_name} ({emp.employee_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Asset Selection */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Asset</label>
                        <select
                            value={formData.asset_id}
                            onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)', color: 'var(--text-primary)'
                            }}
                            required
                        >
                            <option value="">-- Choose Available Asset --</option>
                            {availableAssets.length === 0 ? (
                                <option disabled>No assets available in stock</option>
                            ) : (
                                availableAssets.map(asset => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.model} - {asset.asset_id} ({asset.asset_type})
                                    </option>
                                ))
                            )}
                        </select>
                        {availableAssets.length === 0 && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Note: Only assets with status 'in_stock' are shown here.
                            </p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Assignment Date</label>
                        <input
                            type="date"
                            value={formData.assigned_date}
                            onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)', color: 'var(--text-primary)'
                            }}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Condition check, accessories included..."
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            style={{
                                padding: '0.75rem 1.5rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'transparent', color: 'var(--text-primary)',
                                cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                flex: 1,
                                padding: '0.75rem 1.5rem', borderRadius: '6px',
                                border: 'none',
                                background: 'var(--primary)', color: 'white',
                                cursor: 'pointer', fontWeight: 600,
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? 'Assigning...' : 'Confirm Assignment'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
