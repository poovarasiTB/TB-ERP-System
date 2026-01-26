'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, Asset, Employee } from '@/lib/api';

export default function AssignAssetPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [asset, setAsset] = useState<Asset | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    async function loadData() {
        const [assetRes, empRes] = await Promise.all([
            api.assets.get(id),
            api.employees.list()
        ]);

        if (assetRes.data) setAsset(assetRes.data);
        if (empRes.data) setEmployees(empRes.data.items);
    }

    const handleAssign = async () => {
        if (!selectedEmployee) return;
        setSubmitting(true);
        try {
            const res = await api.assets.assign(id, {
                employee_id: parseInt(selectedEmployee),
                notes: notes,
                assigned_date: new Date().toISOString()
            });

            if (res.error) {
                alert(res.message);
            } else {
                router.push(`/dashboard/assets/${id}`);
            }
        } catch (err) {
            alert('Failed to assign asset');
        } finally {
            setSubmitting(false);
        }
    };

    if (!asset) return <div className="p-8">Loading...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Assign Asset</h1>

            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <div style={{ fontWeight: 600 }}>{asset.manufacturer} {asset.model}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>SN: {asset.serial_number}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }} className="status-badge status-active">
                    Currently: {asset.status}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>Select Employee</label>
                    <select
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                        <option value="">-- Choose Employee --</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.email})</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>Assignment Notes</label>
                    <textarea
                        rows={3}
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}
                        placeholder="Condition check, accessories included..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        className="btn"
                        onClick={() => router.back()}
                        style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleAssign}
                        disabled={submitting || !selectedEmployee}
                    >
                        {submitting ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
