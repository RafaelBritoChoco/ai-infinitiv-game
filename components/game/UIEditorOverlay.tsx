import React, { useState, useEffect } from 'react';

interface UIEditorOverlayProps {
    isActive: boolean;
}

export const UIEditorOverlay: React.FC<UIEditorOverlayProps> = ({ isActive }) => {
    const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [elementInfo, setElementInfo] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
    } | null>(null);

    useEffect(() => {
        if (!isActive) {
            setSelectedElement(null);
            setSelectedElement(clickable);
            const rect = clickable.getBoundingClientRect();
            setElementInfo({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                text: clickable.textContent || ''
            });
        }
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
        if (selectedElement) {
            const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
            const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

            if ((e.target as HTMLElement) === selectedElement || selectedElement.contains(e.target as HTMLElement)) {
                setIsDragging(true);
                const rect = selectedElement.getBoundingClientRect();
                setDragOffset({
                    x: clientX - rect.left,
                    y: clientY - rect.top
                });
            }
        }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (isDragging && selectedElement) {
            const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
            const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

            const newX = clientX - dragOffset.x;
            const newY = clientY - dragOffset.y;

            selectedElement.style.position = 'fixed';
            selectedElement.style.left = `${newX}px`;
            selectedElement.style.top = `${newY}px`;

            setElementInfo(prev => prev ? { ...prev, x: newX, y: newY } : null);
        }
    };

    const handleEnd = () => {
        setIsDragging(false);
    };

    document.addEventListener('click', handleClick as EventListener, true);
    document.addEventListener('mousedown', handleStart as EventListener);
    document.addEventListener('mousemove', handleMove as EventListener);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchstart', handleStart as EventListener, { passive: false });
    document.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
        document.removeEventListener('click', handleClick as EventListener, true);
        document.removeEventListener('mousedown', handleStart as EventListener);
        document.removeEventListener('mousemove', handleMove as EventListener);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchstart', handleStart as EventListener);
        document.removeEventListener('touchmove', handleMove as EventListener);
        document.removeEventListener('touchend', handleEnd);
    };
}, [isActive, selectedElement, isDragging, dragOffset]);

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

return (
    <>
        {selectedElement && elementInfo && (
            <div
                style={{
                    position: 'fixed',
                    left: `${elementInfo.x}px`,
                    top: `${elementInfo.y}px`,
                    width: `${elementInfo.width}px`,
                    height: `${elementInfo.height}px`,
                    border: '2px solid #3b82f6',
                    pointerEvents: 'none',
                    zIndex: 99999,
                    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
                }}
            />
        )}

        {selectedElement && elementInfo && (
            <div
                style={{
                    position: 'fixed',
                    bottom: isMobile ? '70px' : 'auto',
                    top: isMobile ? 'auto' : '80px',
                    left: isMobile ? '50%' : 'auto',
                    right: isMobile ? 'auto' : '20px',
                    transform: isMobile ? 'translateX(-50%)' : 'none',
                    background: 'rgba(0, 0, 0, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '6px',
                    padding: isMobile ? '4px 8px' : '12px',
                    color: 'white',
                    fontSize: isMobile ? '8px' : '11px',
                    zIndex: 100000,
                    minWidth: isMobile ? 'auto' : '200px',
                    maxWidth: isMobile ? '200px' : '300px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}
            >
                <div style={{ fontWeight: 'bold', marginBottom: isMobile ? '2px' : '8px', color: '#3b82f6', fontSize: isMobile ? '9px' : '12px' }}>
                    {isMobile ? '📱' : '🖱️'} Selected
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '2px' : '6px', marginBottom: isMobile ? '2px' : '8px', fontSize: isMobile ? '7px' : '10px' }}>
                    <div><strong>X:</strong> {Math.round(elementInfo.x)}</div>
                    <div><strong>Y:</strong> {Math.round(elementInfo.y)}</div>
                    <div><strong>W:</strong> {Math.round(elementInfo.width)}</div>
                    <div><strong>H:</strong> {Math.round(elementInfo.height)}</div>
                </div>
            </div>
        )}

        <div
            style={{
                position: 'fixed',
                bottom: isMobile ? '10px' : '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                borderRadius: '999px',
                padding: isMobile ? '4px 12px' : '8px 20px',
                color: '#3b82f6',
                fontSize: isMobile ? '8px' : '12px',
                fontWeight: 'bold',
                zIndex: 100000,
                backdropFilter: 'blur(10px)'
            }}
        >
            🎯 {isMobile ? 'TAP' : 'CLICK & DRAG'}
        </div>
    </>
);
};
