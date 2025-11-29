import { GameConfig, GameState, Player, Platform, Particle, LeaderboardEntry, FloatingText } from '../../types';
import { SceneryObject, drawBackground } from '../background';
import { drawPlatformTexture } from '../platformRender';
import { drawCharacter, drawSimpleSprite } from '../playerRender';
import { getScaleAndOffset } from '../utils';
import { COLLECTIBLE_SPRITES } from '../assets';

export interface RenderContext {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    config: GameConfig;
    state: GameState;
    player: Player & { squashX: number, squashY: number, eyeBlinkTimer: number, facingRight: boolean };
    camera: { y: number, targetY: number, shake: number };
    zoom: number;
    background: SceneryObject[];
    timeElapsed: number;
    weedMode?: boolean;
    leaderboard: LeaderboardEntry[];
    localLeaderboard?: LeaderboardEntry[];
    platforms: Platform[];
    selectedPlatformId: number | null;
    particles: Particle[];
    trail: any[];
    floatingTexts: FloatingText[];
    damageFlash: number;
    recordCelebration: { active: boolean; rank: number; timer: number; position: number };
}

export const renderGame = (context: RenderContext) => {
    const {
        ctx, width, height, config, state, player, camera, zoom, background,
        timeElapsed, weedMode, leaderboard, localLeaderboard, platforms,
        selectedPlatformId, particles, trail, floatingTexts, damageFlash, recordCelebration
    } = context;

    ctx.imageSmoothingEnabled = false;

    const { scale, centerOffsetY, currentWorldWidth, offsetX } = getScaleAndOffset(width, height, player.y, zoom, config, state.isFreefallMode);
    const getScreenY = (wy: number) => (wy - camera.y) * scale + centerOffsetY;
    const worldToScreenX = (wx: number) => wx * scale + offsetX;

    const currentMaxFuel = (config.JETPACK_FUEL_MAX || 0) + (state.upgrades.maxFuel * (config.UPGRADE_FUEL_BONUS || 25));

    drawBackground(ctx, background, camera.y, scale, getScreenY, worldToScreenX, width, height, timeElapsed, weedMode);

    const groundScreenY = getScreenY(100);
    if (groundScreenY < height) {
        ctx.fillStyle = weedMode ? '#22c55e' : '#06b6d4';
        ctx.fillRect(0, groundScreenY, width, 4 * scale);
        ctx.fillStyle = weedMode ? '#022c22' : '#020617';
        ctx.fillRect(0, groundScreenY + (4 * scale), width, height - (groundScreenY + 4 * scale));
    }

    // --- RENDER LEADERBOARD LINES ---
    const playerAltitude = Math.abs(Math.min(0, player.y));

    // Helper to draw a record line
    const drawRecordLine = (entry: LeaderboardEntry, index: number, isLocal: boolean) => {
        const entryWorldY = -(entry.score * 10);
        const screenEntryY = getScreenY(entryWorldY);

        if (screenEntryY > -100 && screenEntryY < height + 100) {
            // Colors and styles based on position
            let color = '#ffd700'; // Gold for 1st
            let bgColor = 'rgba(255, 215, 0, 0.15)';
            let lineWidth = 6;
            let glowIntensity = 40;

            if (index === 1) {
                color = '#c0c0c0';
                bgColor = 'rgba(192, 192, 192, 0.1)';
                lineWidth = 4;
                glowIntensity = 25;
            }
            if (index === 2) {
                color = '#cd7f32';
                bgColor = 'rgba(205, 127, 50, 0.1)';
                lineWidth = 3;
                glowIntensity = 20;
            }

            // Local records are dimmer
            if (isLocal) {
                color = '#ffffff'; // White for local
                bgColor = 'rgba(255, 255, 255, 0.05)';
                glowIntensity = 10;
                lineWidth = 2;
            }

            // CROSSING EFFECT (Visual Glitch)
            let distortionX = 0;
            let distortionY = 0;
            // Use screen Y distance for visual effect, not world altitude (which is in meters)
            // entry.score is in meters. playerAltitude is in pixels (approx).
            // Wait, playerAltitude = Math.abs(player.y). player.y is in pixels.
            // entry.score is in meters.
            // entryWorldY = -(entry.score * 10).
            // So we should compare player.y with entryWorldY.

            const distPixels = Math.abs(player.y - entryWorldY);

            // Only distort if VERY close (within 50 pixels)
            if (distPixels < 50) {
                // Reduced distortion to avoid "collision" feeling
                distortionX = (Math.random() - 0.5) * 5 * scale;
                distortionY = (Math.random() - 0.5) * 2 * scale;
            }

            ctx.save();

            // Background zone
            const zoneHeight = (isLocal ? 30 : 60) * scale;
            ctx.fillStyle = bgColor;
            ctx.globalAlpha = isLocal ? 0.3 : 1.0; // Lower opacity for local
            ctx.fillRect(0, screenEntryY - zoneHeight / 2 + distortionY, width, zoneHeight);

            // Pulsing border effect (Global only)
            if (!isLocal) {
                const pulse = Math.sin(timeElapsed * 3) * 0.3 + 0.7;
                ctx.strokeStyle = color;
                ctx.globalAlpha = pulse;
                ctx.lineWidth = 2 * scale;
                ctx.setLineDash([]);
                ctx.strokeRect(0, screenEntryY - zoneHeight / 2 + distortionY, width, zoneHeight);
            }

            ctx.globalAlpha = isLocal ? 0.5 : 1.0;

            // Main record line
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth * scale;
            ctx.shadowColor = color;
            ctx.shadowBlur = glowIntensity;
            ctx.setLineDash(isLocal ? [4 * scale, 4 * scale] : []); // Dashed for local
            ctx.moveTo(0 + distortionX, screenEntryY + distortionY);
            ctx.lineTo(width + distortionX, screenEntryY + distortionY);
            ctx.stroke();

            // Secondary dashed line (Global only)
            if (!isLocal) {
                ctx.shadowBlur = 0;
                ctx.lineWidth = 1 * scale;
                ctx.setLineDash([8 * scale, 4 * scale]);
                ctx.moveTo(0 + distortionX, screenEntryY - 3 * scale + distortionY);
                ctx.lineTo(width + distortionX, screenEntryY - 3 * scale + distortionY);
                ctx.stroke();
                ctx.moveTo(0 + distortionX, screenEntryY + 3 * scale + distortionY);
                ctx.lineTo(width + distortionX, screenEntryY + 3 * scale + distortionY);
                ctx.stroke();
            }

            // Text Label
            ctx.fillStyle = color;
            ctx.font = `bold ${isLocal ? 16 * scale : 24 * scale}px monospace`;
            ctx.textAlign = 'right';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(`${isLocal ? 'LOCAL: ' : ''}${entry.name} - ${entry.score}m`, width - 20 * scale, screenEntryY - 10 * scale + distortionY);

            ctx.restore();
        }
    };

    // Draw Global Records (Top 3)
    if (leaderboard && leaderboard.length > 0) {
        let count = 0;
        for (const entry of leaderboard) {
            if (entry.score > 0) {
                drawRecordLine(entry, count, false);
                count++;
            }
            if (count >= 3) break;
        }
    }

    // Draw Local Records (Top 3) - If distinct from global
    if (localLeaderboard && localLeaderboard.length > 0) {
        let count = 0;
        for (const entry of localLeaderboard) {
            if (entry.score > 0) {
                // Don't draw if it's exactly the same as a visible global record to avoid clutter
                let isDuplicate = false;
                for (let i = 0; i < Math.min(3, leaderboard.length); i++) {
                    if (Math.abs(leaderboard[i].score - entry.score) < 5) {
                        isDuplicate = true;
                        break;
                    }
                }

                if (!isDuplicate) {
                    drawRecordLine(entry, count, true);
                    count++;
                }
            }
            if (count >= 3) break;
        }
    }

    // LOCAL HIGH SCORE
    if (state.highScore > 500) {
        const entryWorldY = -(state.highScore * 10);
        const screenEntryY = getScreenY(entryWorldY);

        if (screenEntryY > -100 && screenEntryY < height + 100) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2 * scale;
            ctx.setLineDash([5 * scale, 5 * scale]);
            ctx.beginPath();
            ctx.moveTo(0, screenEntryY);
            ctx.lineTo(width, screenEntryY);
            ctx.stroke();

            // Label (Normal Name)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = `${10 * scale}px "Rajdhani", sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(`RECORD PESSOAL: ${state.highScore}m`, 10 * scale, screenEntryY - 5 * scale);
            ctx.restore();
        }
    }

    const shakeX = (Math.random() - 0.5) * camera.shake;
    const shakeY = (Math.random() - 0.5) * camera.shake;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    const currentAltitude = Math.abs(Math.min(0, player.y)) / 10;
    const neonIntensity = Math.min(1, Math.max(0.1, currentAltitude / 5000));

    platforms.forEach(p => {
        if (p.broken && !state.isEditing) return;
        let drawY = p.y;
        if (p.type === 'STATIC' || p.type === 'STICKY') { drawY += Math.sin(timeElapsed * 1 + p.x * 0.01) * 2; }

        drawPlatformTexture(
            ctx,
            p,
            worldToScreenX(p.x),
            getScreenY(drawY),
            p.width * scale,
            p.height * scale,
            scale,
            timeElapsed,
            state,
            selectedPlatformId,
            config,
            player,
            weedMode
        );

        if (p.collectible && !p.collectible.collected) {
            const cx = worldToScreenX(p.x + p.collectible.x);
            const cy = getScreenY(p.y + p.collectible.y + (Math.sin(timeElapsed * 4) * 5));
            const cSize = p.collectible.width * scale;
            const spinScale = Math.cos(timeElapsed * 5 + p.id);

            const coinColors = { 0: null, 1: '#713f12', 2: '#eab308', 3: '#fef08a' };
            const fuelColors = { 0: null, 1: '#1e3a8a', 2: '#3b82f6', 3: '#60a5fa', 4: '#93c5fd' };
            const heartColors = { 0: null, 1: '#7f1d1d', 2: '#ef4444', 3: '#fca5a5' };

            ctx.save();

            // Different glow colors based on type
            if (p.collectible.type === 'HEART') {
                ctx.shadowBlur = 15 + (neonIntensity * 35);
                ctx.shadowColor = '#ef4444';
                // Draw heart shape
                const heartSize = cSize * 0.8;
                const hx = cx + cSize / 2;
                const hy = cy + cSize / 2;
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(hx, hy + heartSize * 0.3);
                ctx.bezierCurveTo(hx, hy - heartSize * 0.1, hx - heartSize * 0.5, hy - heartSize * 0.1, hx - heartSize * 0.5, hy + heartSize * 0.1);
                ctx.bezierCurveTo(hx - heartSize * 0.5, hy + heartSize * 0.4, hx, hy + heartSize * 0.6, hx, hy + heartSize * 0.6);
                ctx.bezierCurveTo(hx, hy + heartSize * 0.6, hx + heartSize * 0.5, hy + heartSize * 0.4, hx + heartSize * 0.5, hy + heartSize * 0.1);
                ctx.bezierCurveTo(hx + heartSize * 0.5, hy - heartSize * 0.1, hx, hy - heartSize * 0.1, hx, hy + heartSize * 0.3);
                ctx.fill();
                // Inner highlight
                ctx.fillStyle = '#fca5a5';
                ctx.beginPath();
                ctx.arc(hx - heartSize * 0.2, hy + heartSize * 0.05, heartSize * 0.12, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.shadowBlur = 10 + (neonIntensity * 30);
                ctx.shadowColor = p.collectible.type === 'FUEL' ? '#3b82f6' : '#eab308';

                drawSimpleSprite(
                    ctx,
                    p.collectible.type === 'FUEL' ? COLLECTIBLE_SPRITES.FUEL : COLLECTIBLE_SPRITES.COIN,
                    cx, cy, cSize,
                    p.collectible.type === 'FUEL' ? fuelColors : coinColors,
                    spinScale
                );
            }
            ctx.restore();
        }
    });

    trail.forEach(t => {
        ctx.globalAlpha = t.life * 0.5;
        const ts = (config.PLAYER_SIZE || 80) * scale;
        drawCharacter(ctx, t.skin, worldToScreenX(t.x), getScreenY(t.y), ts, t.scaleY, t.facingRight, 0, 1000, true, false, weedMode);
    });
    ctx.globalAlpha = 1.0;

    if (!state.isGameOver) {
        const plx = worldToScreenX(player.x);
        const ply = getScreenY(player.y);
        const pls = (config.PLAYER_SIZE || 80) * scale * 1.3;

        if (player.vy > (config.SAFE_FALL_SPEED || 28)) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            for (let i = 0; i < 3; i++) {
                const rx = plx + Math.random() * pls;
                const ry = ply - (Math.random() * pls);
                ctx.fillRect(rx, ry, 2 * scale, Math.random() * pls * 2);
            }
        }

        if (currentMaxFuel > 0 && state.fuel > 0 && !state.isGameOver) {
            const barW = pls;
            const barH = 6 * scale;
            const barX = plx;
            const barY = ply - 12 * scale;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(barX - 1 * scale, barY - 1 * scale, barW + 2 * scale, barH + 2 * scale);
            ctx.fillStyle = '#334155';
            ctx.fillRect(barX, barY, barW, barH);
            const fillPct = state.fuel / currentMaxFuel;
            ctx.fillStyle = fillPct < 0.3 ? '#ef4444' : '#22d3ee';
            ctx.fillRect(barX, barY, barW * fillPct, barH);
        }

        if (state.upgrades.shield > 0) {
            ctx.save();
            ctx.shadowColor = '#60a5fa';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = `rgba(96, 165, 250, ${0.3 + Math.sin(timeElapsed * 5) * 0.2})`;
            ctx.lineWidth = 3 * scale;
            ctx.beginPath();
            ctx.arc(plx + pls / 2, ply + pls / 2, pls * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Pass isSticky if waiting for first jump or if cooldown is active
        const isStuck = state.waitingForFirstJump || (player.jumpCooldown > 0 && player.isGrounded);
        drawCharacter(ctx, state.selectedSkin, plx, ply, pls, player.squashY, player.facingRight, player.vy, player.eyeBlinkTimer, false, isStuck, weedMode);

        if (player.x < 100) {
            drawCharacter(ctx, state.selectedSkin, worldToScreenX(player.x + currentWorldWidth), ply, pls, player.squashY, player.facingRight, player.vy, player.eyeBlinkTimer, false, isStuck, weedMode);
        } else if (player.x > currentWorldWidth - 100) {
            drawCharacter(ctx, state.selectedSkin, worldToScreenX(player.x - currentWorldWidth), ply, pls, player.squashY, player.facingRight, player.vy, player.eyeBlinkTimer, false, isStuck, weedMode);
        }
    }

    // Draw Particles (Conditional)
    if (config.PERFORMANCE_MODE !== 'low' || particles.length < 50) {
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(worldToScreenX(p.x), getScreenY(p.y), p.size * scale, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    ctx.globalAlpha = 1.0;

    floatingTexts.forEach(t => {
        const tx = worldToScreenX(t.x);
        const ty = getScreenY(t.y);
        const fontSize = (t.size * scale) * 1.2;

        ctx.save();
        ctx.font = `900 ${fontSize}px "Rajdhani", sans-serif`;
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4 * scale;
        ctx.lineJoin = 'round';

        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6 * scale;
        ctx.globalAlpha = Math.max(0, t.life);

        const popScale = 1 + Math.sin((1 - Math.min(1, t.life)) * 3) * 0.5;
        ctx.translate(tx, ty);
        ctx.scale(popScale, popScale);

        ctx.strokeText(t.text, 0, 0);
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
    });

    ctx.restore();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, worldToScreenX(0), height);
    ctx.fillRect(worldToScreenX(currentWorldWidth), 0, width - worldToScreenX(currentWorldWidth), height);

    if (zoom > 1.1) {
        const alpha = Math.min(0.4, (zoom - 1.1) * 0.6);
        ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`;
        ctx.fillRect(0, 0, width, height);
    }

    if (!state.isGameOver && state.isPlaying) {
        // RECORD CELEBRATION EFFECT - Small trophy in corner (NOT blocking gameplay)
        if (recordCelebration.active) {
            const cel = recordCelebration;
            const fadeIn = Math.min(1, (180 - cel.timer) / 20); // Quick fade in
            const fadeOut = cel.timer < 40 ? cel.timer / 40 : 1; // Fade out
            const alpha = fadeIn * fadeOut;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Small trophy box in BOTTOM RIGHT corner (like achievement popup)
            const boxWidth = 160 * scale;
            const boxHeight = 60 * scale;
            const boxX = width - boxWidth - 15 * scale;
            const boxY = height - boxHeight - 15 * scale;
            const bounce = Math.sin(timeElapsed * 8) * 3 * scale;

            // Background
            const bgColor = cel.rank === 1 ? 'rgba(234, 179, 8, 0.9)' : cel.rank === 2 ? 'rgba(148, 163, 184, 0.9)' : 'rgba(180, 83, 9, 0.9)';
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY + bounce, boxWidth, boxHeight, 10 * scale);
            ctx.fill();

            // Border glow
            ctx.strokeStyle = cel.rank === 1 ? '#ffd700' : cel.rank === 2 ? '#e5e5e5' : '#f59e0b';
            ctx.lineWidth = 3 * scale;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Trophy icon
            const emoji = cel.rank === 1 ? '🏆' : cel.rank === 2 ? '🥈' : '🥉';
            ctx.font = `${28 * scale}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, boxX + 10 * scale, boxY + bounce + boxHeight / 2);

            // Text
            ctx.fillStyle = '#000000';
            ctx.font = `900 ${14 * scale}px "Rajdhani", sans-serif`;
            ctx.textAlign = 'left';
            const text = cel.rank === 1 ? 'TOP 1!' : cel.rank === 2 ? 'TOP 2!' : 'TOP 3!';
            ctx.fillText(text, boxX + 45 * scale, boxY + bounce + 22 * scale);

            ctx.font = `600 ${11 * scale}px "Rajdhani", sans-serif`;
            ctx.fillStyle = '#1e293b';
            ctx.fillText(`Passou ${cel.position}m`, boxX + 45 * scale, boxY + bounce + 42 * scale);

            ctx.restore();
        }
    }
};
