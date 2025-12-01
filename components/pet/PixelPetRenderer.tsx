import React, { useMemo } from 'react';

interface PixelPetRendererProps {
    pixels: number[][];
    scale?: number;
    className?: string;
    showGrid?: boolean;
}

const COLOR_PALETTE = [
    { id: 0, color: 'transparent' },
    { id: 1, color: '#0f172a' }, // Preto
    { id: 2, color: '#d4a574' }, // Pele
    { id: 3, color: '#ffffff' }, // Branco
    { id: 4, color: '#ffffff' }, // Branco Olho
    { id: 5, color: '#000000' }, // Pupila
    { id: 6, color: '#facc15' }, // Detalhe (Amarelo)
    { id: 7, color: '#dc2626' }, // Vermelho
    { id: 8, color: '#22c55e' }, // Verde
    { id: 9, color: '#3b82f6' }, // Azul
    { id: 10, color: '#a855f7' }, // Roxo
    { id: 11, color: '#ec4899' }, // Rosa
    { id: 12, color: '#f97316' }, // Laranja
    { id: 13, color: '#94a3b8' }, // Cinza
    { id: 14, color: '#78350f' }  // Marrom
];

export const PixelPetRenderer: React.FC<PixelPetRendererProps> = ({
    pixels,
    scale = 1,
    className = '',
    showGrid = false
}) => {
    const getColor = (id: number) => {
        return COLOR_PALETTE.find(c => c.id === id)?.color || 'transparent';
    };

    // Memoize the SVG generation for performance
    const svgContent = useMemo(() => {
        if (!pixels || pixels.length === 0) return null;

        const size = pixels.length;
        const rects: JSX.Element[] = [];

        pixels.forEach((row, y) => {
            row.forEach((colorId, x) => {
                if (colorId !== 0) {
                    rects.push(
                        <rect
                            key={`${x}-${y}`}
                            x={x}
                            y={y}
                            width="1"
                            height="1"
                            fill={getColor(colorId)}
                        />
                    );
                }
            });
        });

        return (
            <svg
                viewBox={`0 0 ${size} ${size}`}
                width={size * scale}
                height={size * scale}
                style={{ imageRendering: 'pixelated' }}
                className="drop-shadow-lg"
            >
                {rects}
                {showGrid && (
                    <g stroke="rgba(255,255,255,0.1)" strokeWidth="0.05">
                        {Array.from({ length: size }).map((_, i) => (
                            <React.Fragment key={i}>
                                <line x1="0" y1={i} x2={size} y2={i} />
                                <line x1={i} y1="0" x2={i} y2={size} />
                            </React.Fragment>
                        ))}
                    </g>
                )}
            </svg>
        );
    }, [pixels, scale, showGrid]);

    return (
        <div className={`pixel-pet-renderer ${className}`}>
            {svgContent}
        </div>
    );
};
