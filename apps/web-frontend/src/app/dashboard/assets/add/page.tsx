'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Category {
    id: number;
    name: string;
    spec_fields: string[];
    allowed_values: Record<string, string[]>;
}

export default function AddAssetPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Fetch categories on mount
        async function fetchCategories() {
            try {
                const res = await fetch('http://localhost:8001/api/v1/categories'); // Using direct URL for now, should use api helper
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        }
        fetchCategories();
    }, []);

    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category);
        setFormData({ asset_type: category.name });
        setStep(2);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Map dynamic fields to asset model
            // Note: The backend Asset model has fixed fields like 'manufacturer', 'model', etc.
            // But our dynamic form uses spec_fields. We need to map them.
            // Fortunately the field names 'Manufacturer', 'Model' map close enough, just need casing.

            const payload: any = {
                asset_id: `TBA${Math.floor(Math.random() * 100000)}`, // Auto-generate for now
                asset_type: selectedCategory?.name,
                status: 'in_stock',
                serial_number: formData['Serial Number'] || 'N/A'
            };

            // Map standard fields
            const fieldMapping: Record<string, string> = {
                'Manufacturer': 'manufacturer',
                'Model': 'model',
                'OS': 'os_installed',
                'Processor': 'processor',
                'RAM': 'ram_size_gb',
                'Storage': 'hard_drive_size',
                'Battery Condition': 'battery_condition'
            };

            if (selectedCategory) {
                selectedCategory.spec_fields.forEach(field => {
                    const mappedKey = fieldMapping[field];
                    if (mappedKey && formData[field]) {
                        payload[mappedKey] = formData[field];
                    }
                });
            }

            // Asset Class determination
            if (['Laptop', 'Mobile', 'Tablet'].includes(selectedCategory?.name || '')) {
                payload.asset_class = 'System';
            } else {
                payload.asset_class = 'Peripheral';
            }

            const res = await api.assets.create(payload);
            if (res.error) {
                alert(`Error: ${res.message}`);
            } else {
                router.push('/dashboard/assets');
            }

        } catch (err) {
            console.error(err);
            alert("Failed to create asset");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Add New Asset</h1>

            {/* Progress Steps */}
            <div style={{ display: 'flex', marginBottom: '3rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
                <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: step >= 1 ? 'var(--primary)' : 'var(--bg-card)',
                        color: step >= 1 ? 'white' : 'var(--text-secondary)',
                        border: '2px solid',
                        borderColor: step >= 1 ? 'var(--primary)' : 'var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, margin: '0 auto 0.5rem'
                    }}>1</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Select Category</span>
                </div>
                <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: step >= 2 ? 'var(--primary)' : 'var(--bg-card)',
                        color: step >= 2 ? 'white' : 'var(--text-secondary)',
                        border: '2px solid',
                        borderColor: step >= 2 ? 'var(--primary)' : 'var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, margin: '0 auto 0.5rem'
                    }}>2</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Enter Details</span>
                </div>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
                    {categories.map(category => (
                        <div
                            key={category.id}
                            onClick={() => handleCategorySelect(category)}
                            className="card module-card"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                textAlign: 'center',
                                padding: '2rem 1rem'
                            }}
                        >
                            <h3 style={{ fontSize: '1rem', marginTop: 0 }}>{category.name}</h3>
                        </div>
                    ))}
                </div>
            )}

            {step === 2 && selectedCategory && (
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        New {selectedCategory.name}
                    </h2>

                    <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                        {/* Always ask for Serial Number */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Serial Number</label>
                            <input
                                type="text"
                                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                                onChange={(e) => handleInputChange('Serial Number', e.target.value)}
                            />
                        </div>

                        {selectedCategory.spec_fields.map(field => {
                            const options = selectedCategory.allowed_values[field];
                            return (
                                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{field}</label>
                                    {options && options.length > 0 ? (
                                        <select
                                            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                                            onChange={(e) => handleInputChange(field, e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                                            onChange={(e) => handleInputChange(field, e.target.value)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            className="btn"
                            style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
                            onClick={() => setStep(1)}
                        >
                            Back
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Creating...' : 'Create Asset'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
