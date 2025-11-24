import React, { useRef, useEffect, useState } from 'react';
import * as Constants from '../../constants';

interface VirtualJoystickProps {
    onMove: (x: number, y: number) => void; // x: -1 to 1, y: -1 to 1
    size?: number;
    opacity?: number;
}


export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
    onMove,
    size = 150,
    opacity = 0.5
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [origin, setOrigin] = useState({ x: 0, y: 0 }); // Where the touch started (center of joystick)
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Current knob position relative to origin

    const touchId = useRef<number | null>(null);
    const pendingMove = useRef<{ dx: number, dy: number } | null>(null);
    const rafId = useRef<number | null>(null);
    const lastUpdateTime = useRef<number>(0);

    // PERFORMANCE: Throttled update using RAF
    const performanceMode = Constants.PERFORMANCE_MODE || 'auto';
    const updateThrottle = performanceMode === 'low' ? Constants.INPUT_THROTTLE_MS_LOW : Constants.INPUT_THROTTLE_MS_HIGH;

    useEffect(() => {
        const updateLoop = () => {
            const now = performance.now();

            if (pendingMove.current && (now - lastUpdateTime.current >= updateThrottle)) {
                const { dx, dy } = pendingMove.current;
                const radius = size / 2;

                setPosition({ x: dx, y: dy });

                // Normalize output (-1 to 1)
                const normalizedX = dx / radius;
                const normalizedY = dy / radius;
                onMove(normalizedX, normalizedY);

                pendingMove.current = null;
                lastUpdateTime.current = now;
            }

            if (touchId.current !== null) {
                rafId.current = requestAnimationFrame(updateLoop);
            }
        };

        if (touchId.current !== null) {
            rafId.current = requestAnimationFrame(updateLoop);
        }

        return () => {
            if (rafId.current !== null) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, [touchId.current, updateThrottle, size, onMove]);

    // Handle touch start on the entire left half of the screen
    const handleTouchStart = (e: React.TouchEvent) => {
        // Prevent default to stop scrolling/zooming
        // e.preventDefault(); // CAREFUL: blocking default on a large area might block other interactions if not careful. 
        // But for a game controller layer, it's usually desired.

        // Only handle if no active touch
        if (touchId.current !== null) return;

        const touch = e.changedTouches[0];
        const halfWidth = window.innerWidth / 2;

        // Only activate if touch is on the LEFT half
        if (touch.clientX < halfWidth) {
            touchId.current = touch.identifier;
            setOrigin({ x: touch.clientX, y: touch.clientY });
            setPosition({ x: 0, y: 0 });
            setIsVisible(true);
            onMove(0, 0);
            lastUpdateTime.current = performance.now();
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchId.current === null) return;

        const touch = Array.from(e.changedTouches).find((t: any) => t.identifier === touchId.current) as React.Touch | undefined;
        if (touch) {
            // Calculate delta from origin
            let dx = touch.clientX - origin.x;
            let dy = touch.clientY - origin.y;

            const radius = size / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Clamp to radius
            if (distance > radius) {
                const angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * radius;
                dy = Math.sin(angle) * radius;
            }

            // Store pending move for RAF update
            pendingMove.current = { dx, dy };
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchId.current === null) return;

        const touch = Array.from(e.changedTouches).find((t: any) => t.identifier === touchId.current);
        if (touch) {
            setIsVisible(false);
            touchId.current = null;
            setPosition({ x: 0, y: 0 });
            pendingMove.current = null;
            onMove(0, 0);

            if (rafId.current !== null) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
        }
    };

    return (
        <div
            className="absolute left-0 top-0 bottom-0 w-1/2 z-[50] touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {/* Visual Joystick (Only visible when active) */}
            {isVisible && (
                <div
                    style={{
                        position: 'absolute',
                        left: origin.x,
                        top: origin.y,
                        width: size,
                        height: size,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none', // Let touches pass through to the container
                        opacity: opacity,
                        transition: 'opacity 0.1s'
                    }}
                >
                    {/* Base */}
                    <div className="w-full h-full rounded-full border-2 border-cyan-500/30 bg-cyan-900/20 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.2)]"></div>

                    {/* Knob */}
                    <div
                        className="absolute w-1/3 h-1/3 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] border-2 border-white/50"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
                        }}
                    ></div>
                </div>
            )}

            {/* Hint Text (Only visible when NOT active) */}
            {!isVisible && (
                <div className="absolute bottom-32 left-1/4 -translate-x-1/2 text-slate-500/30 text-sm font-bold uppercase tracking-widest pointer-events-none animate-pulse">
                    Touch & Drag
                </div>
            )}
        </div>
    );
};
