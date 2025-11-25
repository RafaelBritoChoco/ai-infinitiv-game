import React, { useRef, useEffect } from 'react';
import { CharacterSkin } from '../../types';

export const CharacterPreview = ({ skin }: { skin: CharacterSkin }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !skin || !skin.pixels) {
            // Clear if no skin data
            if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        const pixelSize = canvas.width / 16;
        skin.pixels.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val === 0) return;
                if (val === 1) ctx.fillStyle = '#0f172a';
                else if (val === 2) ctx.fillStyle = skin.color;
                else if (val === 3) ctx.fillStyle = '#ffffff';
                else if (val === 4) ctx.fillStyle = '#ffffff';
                else if (val === 5) ctx.fillStyle = '#000000';
                else if (val === 6) ctx.fillStyle = '#facc15';
                ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
            });
        });
    }, [skin]);
    return (
        <div className="w-24 h-24 bg-slate-900/80 border-2 border-slate-700 rounded-xl flex items-center justify-center shadow-inner">
            <canvas ref={canvasRef} width={64} height={64} className="w-16 h-16 drop-shadow-xl" style={{ imageRendering: 'pixelated' }} />
        </div>
    );
};
