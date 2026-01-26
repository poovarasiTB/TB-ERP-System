'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, Asset } from '@/lib/api';

export default function ReturnAssetPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [asset, setAsset] = useState<Asset | null>(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    async function loadData() {
        const res = await api.assets.get(id);
        if (res.data) setAsset(res.data);
    }

    const handleReturn = async () => {
        setSubmitting(true);
        try {
            const res = await api.assets.return(id, {
                return_date: new Date().toISOString(),
                notes: notes
            });

            if (res.error) {
                alert(res.message);
            } else {
                router.push(`/dashboard/assets/${id}`);
            }
        } catch (err) {
            alert('Failed to return asset');
        } finally {
            setSubmitting(false);
        }
    };

    if (!asset) return <div className="p-8">Loading...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Return Asset</h1>

            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <div style={{ fontWeight: 600 }}>{asset.manufacturer} {asset.model}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>SN: {asset.serial_number}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="status-badge status-assigned">Currently Assigned</span>
                    <span>to Employee #{asset.assigned_employee_id}</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>Return Notes / Condition</label>
                    <textarea
                        rows={3}
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}
                        placeholder="Condition on return, any issues reported..."
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
                        style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                        onClick={handleReturn}
                        disabled={submitting}
                    >
                        {submitting ? 'Processing...' : 'Confirm Return'}
                    </button>
                </div>
            </div>
        </div>
    );
}
