import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Sélectionner...',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(option => option.value === value);

    return (
        <div 
            ref={selectRef}
            style={{
                position: 'relative',
                width: '100%'
            }}
        >
            <button
                type="button"
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ color: '#4a5568' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span style={{ marginLeft: '0.5rem' }}>▼</span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    zIndex: 10,
                    width: '100%',
                    marginTop: '0.25rem',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '0.5rem 1rem',
                                backgroundColor: value === option.value ? '#f7fafc' : 'transparent',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f7fafc';
                            }}
                            onMouseLeave={(e) => {
                                if (value !== option.value) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}; 