import React, { useEffect, useState } from 'react';

export const FireworksCelebration = ({ rank }: { rank: number }) => {
    const [particles, setParticles] = useState<any[]>([]);
    
    useEffect(() => {
        const colors = rank === 1 
            ? ['#ffd700', '#ffed4a', '#fff', '#fbbf24'] // Gold for 1st
            : rank === 2 
                ? ['#c0c0c0', '#e5e5e5', '#94a3b8', '#cbd5e1'] // Silver for 2nd
                : ['#cd7f32', '#d97706', '#f59e0b', '#fbbf24']; // Bronze for 3rd
        
        const createFirework = () => {
            const centerX = Math.random() * 80 + 10; // 10-90%
            const centerY = Math.random() * 40 + 10; // 10-50%
            const newParticles: any[] = [];
            
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 * i) / 30;
                const speed = Math.random() * 3 + 2;
                newParticles.push({
                    id: Math.random(),
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 1,
                    size: Math.random() * 4 + 2
                });
            }
            setParticles(prev => [...prev, ...newParticles]);
        };
        
        // Create initial fireworks
        createFirework();
        const interval = setInterval(createFirework, 800);
        
        // Animate particles
        const animate = setInterval(() => {
            setParticles(prev => prev
                .map(p => ({
                    ...p,
                    x: p.x + p.vx * 0.3,
                    y: p.y + p.vy * 0.3 + 0.1,
                    vy: p.vy + 0.05,
                    life: p.life - 0.02
                }))
                .filter(p => p.life > 0)
            );
        }, 30);
        
        return () => {
            clearInterval(interval);
            clearInterval(animate);
        };
    }, [rank]);
    
    return (
        <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        opacity: p.life,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`
                    }}
                />
            ))}
        </div>
    );
};
