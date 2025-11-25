import { GameState, Platform, PlatformType, Player, GameConfig } from '../../types';
import * as Constants from '../../constants';

// Helper to draw a small pixel-art Tick/Bracket
const drawPixelTick = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, scale: number, color: string, thicknessMod: number = 1) => {
    const s = scale;
    const size = 4 * s * thicknessMod;
    const thickness = 1.5 * s * thicknessMod;

    ctx.fillStyle = color;

    // Left Bracket [
    ctx.fillRect(x, y, thickness, size); // Vertical
    ctx.fillRect(x, y, size, thickness); // Top Horiz
    ctx.fillRect(x, y + size - thickness, size, thickness); // Bot Horiz

    // Right Bracket ]
    const rx = x + width - thickness;
    ctx.fillRect(rx, y, thickness, size); // Vertical
    ctx.fillRect(rx - size + thickness, y, size, thickness); // Top Horiz
    ctx.fillRect(rx - size + thickness, y + size - thickness, size, thickness); // Bot Horiz
};

export const drawPlatformTexture = (
    ctx: CanvasRenderingContext2D,
    p: Platform,
    px: number,
    py: number,
    pw: number,
    ph: number,
    scale: number,
    timeElapsed: number,
    gameState: GameState,
    selectedPlatformId: number | null,
    config: GameConfig, // Using GameConfig now
    player?: Player,
    weedMode?: boolean
) => {
    // PERFORMANCE MODE: Simple rendering
    if (config.PERFORMANCE_MODE === 'low' || !config.ENABLE_PLATFORM_TEXTURES) {
        let simpleColor = weedMode ? '#22c55e' : '#06b6d4'; // Green in 420 mode
        if (p.type === PlatformType.MOVING) {
            simpleColor = weedMode ? '#a855f7' : '#e879f9'; // Purple
        } else if (p.type === PlatformType.SWAYING) {
            simpleColor = weedMode ? '#facc15' : '#22c55e'; // Yellow
        } else if (p.type === PlatformType.STICKY) {
            simpleColor = weedMode ? '#ef4444' : '#84cc16'; // Red
            if (p.isCrumbling && p.crumbleTimer !== undefined) {
                const ratio = p.crumbleTimer / (p.maxCrumbleTimer || 1.5);
                if (ratio < 0.3) simpleColor = '#ef4444'; // Red
                else if (ratio < 0.6) simpleColor = '#f97316'; // Orange
                else simpleColor = '#eab308'; // Yellow
            } else if (p.maxCrumbleTimer) {
                simpleColor = '#d97706'; // Amber (Unstable Warning)
            }
        } else if (p.broken) {
            simpleColor = '#ef4444'; // Red
        }

        ctx.fillStyle = simpleColor;
        ctx.fillRect(px, py, pw, ph);

        // Simple border
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);
        return;
    }

    // HIGH QUALITY RENDERING
    let mainColor = weedMode ? '#22c55e' : '#06b6d4'; // Default Green/Cyan
    let glowColor = weedMode ? 'rgba(34, 197, 94, 0.5)' : 'rgba(6, 182, 212, 0.5)';

    if (p.type === PlatformType.MOVING) {
        mainColor = weedMode ? '#a855f7' : '#e879f9'; // Purple
        glowColor = weedMode ? 'rgba(168, 85, 247, 0.5)' : 'rgba(232, 121, 249, 0.5)';
    } else if (p.type === PlatformType.SWAYING) {
        mainColor = weedMode ? '#facc15' : '#22c55e'; // Yellow
        glowColor = weedMode ? 'rgba(250, 204, 21, 0.5)' : 'rgba(34, 197, 94, 0.5)';
    } else if (p.type === PlatformType.STICKY) {
        mainColor = weedMode ? '#ef4444' : '#84cc16'; // Red
        glowColor = weedMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(132, 204, 22, 0.5)';

        // CRUMBLE COLOR SHIFT
        if (p.isCrumbling && p.crumbleTimer !== undefined) {
            const ratio = p.crumbleTimer / (p.maxCrumbleTimer || 1.5);
            if (ratio < 0.3) mainColor = '#ef4444'; // Red
            else if (ratio < 0.6) mainColor = '#f97316'; // Orange
            else mainColor = '#eab308'; // Yellow
        } else if (p.maxCrumbleTimer) {
            mainColor = '#d97706'; // Amber (Unstable Warning)
        }

    } else if (p.broken) {
        mainColor = '#ef4444'; // Red
        glowColor = 'rgba(239, 68, 68, 0.5)';
    } else if (p.type === PlatformType.LATERAL_BOUNCE) {
        mainColor = weedMode ? '#10b981' : '#8b5cf6'; // Emerald/Violet
        glowColor = weedMode ? 'rgba(16, 185, 129, 0.5)' : 'rgba(139, 92, 246, 0.5)';
    } else if (p.type === PlatformType.GLITCH) {
        // Glitch color flickers
        const flicker = Math.random() > 0.8;
        mainColor = flicker ? '#ffffff' : '#171717'; // White/Black flicker
        glowColor = 'rgba(255, 255, 255, 0.3)';
    }

    // CRUMBLE SHAKE
    let drawX = px;
    let drawY = py;
    if (p.isCrumbling) {
        drawX += (Math.random() - 0.5) * 5 * scale;
        drawY += (Math.random() - 0.5) * 5 * scale;
    }

    // --- VISUAL PARRY RANGE (HYPER JUMP INDICATOR) ---
    if (player && !p.broken && player.vy > 0) {
        const g = config.GRAVITY || 0.65;
        const dy = p.y - (player.y + player.height);

        if (dy > -50 && dy < 800) {
            const a = 0.5 * g;
            const b = player.vy;
            const c = -dy;
            const discriminant = b * b - 4 * a * c;

            if (discriminant >= 0) {
                const t = (-b + Math.sqrt(discriminant)) / (2 * a);

                const predictedX = player.x + (player.vx * t);
                const platPredLeft = p.x + (p.velocityX || 0) * t;
                const playerWidth = player.width;

                const predLeft = predictedX + playerWidth * 0.2;
                const predRight = predictedX + playerWidth * 0.8;
                const platLeft = platPredLeft;
                const platRight = platPredLeft + p.width;

                const currLeft = player.x + playerWidth * 0.2;
                const currRight = player.x + playerWidth * 0.8;

                const isTrajectoryAligned = (predRight > platLeft && predLeft < platRight);
                const isCurrentlyAligned = (currRight > platLeft && currLeft < platRight);

                if (isTrajectoryAligned || isCurrentlyAligned) {
                    const frames = (config.PARRY_WINDOW_MS || 150) / 16.666;
                    const parryDist = (player.vy * frames) + (0.5 * g * frames * frames);

                    const targetDrawY = drawY - (parryDist * scale);

                    const targetX = isTrajectoryAligned ? predictedX : player.x;

                    const guideW = playerWidth * scale;
                    const offsetScreen = (targetX - p.x) * scale;

                    let guideDrawX = drawX + offsetScreen;
                    guideDrawX = Math.max(drawX, Math.min(drawX + (p.width * scale) - guideW, guideDrawX));

                    const inWindow = dy <= parryDist;
                    const proximity = Math.max(0, 1 - (dy / 600));

                    ctx.save();

                    if (inWindow) {
                        const pulse = Math.sin(Date.now() / 40) * 0.3 + 0.7;
                        ctx.shadowColor = '#f472b6';
                        ctx.shadowBlur = 30 * scale;
                        ctx.fillStyle = '#ffffff';
                        drawPixelTick(ctx, guideDrawX, targetDrawY, guideW, scale, '#ffffff', 2.0);
                        ctx.fillStyle = `rgba(244, 114, 182, ${0.3 + pulse * 0.2})`;
                        ctx.fillRect(guideDrawX, targetDrawY, guideW, 6 * scale);
                    } else {
                        const intensity = Math.pow(proximity, 2);
                        const alpha = 0.4 + (intensity * 0.6);
                        ctx.shadowBlur = 10 * scale * intensity;
                        ctx.shadowColor = '#f472b6';
                        drawPixelTick(ctx, guideDrawX, targetDrawY, guideW, scale, `rgba(244, 114, 182, ${alpha})`, 1.2);
                    }
                    ctx.restore();
                }
            }
        }
    }

    // --- ARROW INDICATOR FOR LATERAL BOUNCE ---
    if (p.type === PlatformType.LATERAL_BOUNCE) {
        // Draw Arrow
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        const arrowSize = 12 * scale;
        const cx = drawX + pw / 2;
        const cy = drawY + ph / 2;
        const dir = p.bounceDirection || 1; // Default right

        ctx.beginPath();
        // Arrow pointing Left or Right
        if (dir === 1) { // Right
            ctx.moveTo(cx - arrowSize/2, cy - arrowSize/2);
            ctx.lineTo(cx + arrowSize/2, cy);
            ctx.lineTo(cx - arrowSize/2, cy + arrowSize/2);
        } else { // Left
            ctx.moveTo(cx + arrowSize/2, cy - arrowSize/2);
            ctx.lineTo(cx - arrowSize/2, cy);
            ctx.lineTo(cx + arrowSize/2, cy + arrowSize/2);
        }
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // 1. Glow Effect (Shadow)
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 15 * scale;

    // 2. Stroke (Wireframe)
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3 * scale;

    // 3. Fill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';

    ctx.beginPath();
    const r = 6 * scale;
    ctx.moveTo(drawX + r, drawY);
    ctx.lineTo(drawX + pw - r, drawY);
    ctx.quadraticCurveTo(drawX + pw, drawY, drawX + pw, drawY + r);
    ctx.lineTo(drawX + pw, drawY + ph - r);
    ctx.quadraticCurveTo(drawX + pw, drawY + ph, drawX + pw - r, drawY + ph);
    ctx.lineTo(drawX + r, drawY + ph);
    ctx.quadraticCurveTo(drawX, drawY + ph, drawX, drawY + ph - r);
    ctx.lineTo(drawX, drawY + r);
    ctx.quadraticCurveTo(drawX, drawY, drawX + r, drawY);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // 4. Inner Detail
    ctx.fillStyle = mainColor;
    ctx.globalAlpha = 0.3;

    if (p.type === PlatformType.STICKY) {
        for (let i = 0; i < pw / (10 * scale); i++) {
            const dripH = (Math.sin(timeElapsed * 3 + i) * 5 + 5) * scale;
            ctx.fillRect(drawX + (i * 10 * scale), drawY + ph - 2 * scale, 4 * scale, dripH);
        }
    } else {
        ctx.fillRect(drawX + 4 * scale, drawY + 4 * scale, pw - 8 * scale, 4 * scale);
        ctx.globalAlpha = 0.8;
        const dotSize = 4 * scale;
        ctx.fillRect(drawX + 6 * scale, drawY + ph - 8 * scale, dotSize, dotSize);
        ctx.fillRect(drawX + pw - 10 * scale, drawY + ph - 8 * scale, dotSize, dotSize);
    }

    ctx.globalAlpha = 1.0;

    if (p.broken) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(drawX + pw * 0.2, drawY + ph * 0.2);
        ctx.lineTo(drawX + pw * 0.5, drawY + ph * 0.8);
        ctx.lineTo(drawX + pw * 0.8, drawY + ph * 0.3);
        ctx.stroke();
    }

    if (gameState.isEditing && selectedPlatformId === p.id) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(drawX - 4, drawY - 4, pw + 8, ph + 8);
        ctx.setLineDash([]);
    }

    // DEBUG: Show hitboxes
    if (gameState.showHitboxes) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);

        // Draw center crosshair
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + pw / 2, py);
        ctx.lineTo(px + pw / 2, py + ph);
        ctx.moveTo(px, py + ph / 2);
        ctx.lineTo(px + pw, py + ph / 2);
        ctx.stroke();
    }
};
