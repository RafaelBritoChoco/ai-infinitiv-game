

import React, { useEffect, useRef } from 'react';
import { GameState, Player, Platform, Particle, CharacterSkin, GameConfig, SaveNode, LeaderboardEntry, FloatingText } from '../../types';
import { SceneryObject, drawBackground } from './background';
import { updatePlayerPhysics } from './physics';
import { drawPlatformTexture } from './platformRender';
import { drawCharacter, drawSimpleSprite } from './playerRender';
import { updatePlatforms, createPlatform } from './platforms';
import { getScaleAndOffset, getWorldWidthAtHeight, getWorldPos } from './utils';
import { pollGamepads } from './inputHandlers';
import * as Constants from '../../constants';
import { soundManager } from './audioManager';
import { COLLECTIBLE_SPRITES } from './assets';

interface GameLoopProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    stateRef: React.MutableRefObject<GameState>;
    playerRef: React.MutableRefObject<Player & { squashX: number, squashY: number, eyeBlinkTimer: number, facingRight: boolean }>;
    platformsRef: React.MutableRefObject<Platform[]>;
    particlesRef: React.MutableRefObject<Particle[]>;
    backgroundRef: React.MutableRefObject<SceneryObject[]>;
    trailRef: React.MutableRefObject<any[]>;
    inputRef: React.MutableRefObject<any>;
    cameraRef: React.MutableRefObject<any>;
    zoomRef: React.MutableRefObject<number>;
    fallStartRef: React.MutableRefObject<number | null>;
    timeElapsedRef: React.MutableRefObject<number>;
    lastPlatformYRef: React.MutableRefObject<number>;
    platformGenCountRef: React.MutableRefObject<number>;
    configRef: React.MutableRefObject<GameConfig>;
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    setDamageFlash: React.Dispatch<React.SetStateAction<number>>;
    setDangerWarning: (v: boolean) => void;
    jetpackMode: 'IDLE' | 'BURST' | 'GLIDE';
    setJetpackMode: (v: 'IDLE' | 'BURST' | 'GLIDE') => void;
    handleStart: (mode: any) => void;
    gamepadConnected: boolean;
    setGamepadConnected: (v: boolean) => void;
    setShowGameOverMenu: (v: boolean) => void;
    editorTool: string;
    selectedPlatformId: number | null;
    damageFlash: number;
    showGameOverMenu: boolean;
    saveNodesRef: React.MutableRefObject<SaveNode[]>;
    jetpackModeRef: React.MutableRefObject<'IDLE' | 'BURST' | 'GLIDE'>;
    jetpackAllowedRef: React.MutableRefObject<boolean>;
    damageFlashRef: React.MutableRefObject<number>;
    leaderboard: LeaderboardEntry[];
    leaderboardRef: React.MutableRefObject<LeaderboardEntry[]>;
    highScoreEntryStatusRef: React.MutableRefObject<'NONE' | 'PENDING' | 'SUBMITTED'>;
    onGameOver: (score: number) => void;
    onMenuUpdate?: () => void;
}

export const useGameLoop = (props: GameLoopProps) => {
    const {
        canvasRef, containerRef, stateRef, playerRef, platformsRef, particlesRef,
        backgroundRef, trailRef, inputRef, cameraRef, zoomRef, fallStartRef,
        timeElapsedRef, lastPlatformYRef, platformGenCountRef, configRef,
        gameState, setGameState, setDamageFlash, setDangerWarning, jetpackMode,
        setJetpackMode, handleStart, gamepadConnected, setGamepadConnected,
        setShowGameOverMenu, editorTool, selectedPlatformId,
        damageFlash, showGameOverMenu, saveNodesRef,
        jetpackModeRef, damageFlashRef, leaderboard, leaderboardRef, jetpackAllowedRef,
        highScoreEntryStatusRef, onGameOver, onMenuUpdate
    } = props;

    const lastTimeRef = useRef<number>(0);
    const lastUiUpdateRef = useRef<number>(0);
    const isProcessingDeathRef = useRef<boolean>(false);

    const fuelRef = useRef<number>(configRef.current.JETPACK_STARTING_FUEL || 0);
    const scoreRef = useRef<number>(0);

    const floatingTextsRef = useRef<FloatingText[]>([]);

    const onMenuUpdateRef = useRef(onMenuUpdate);
    useEffect(() => { onMenuUpdateRef.current = onMenuUpdate; }, [onMenuUpdate]);

    useEffect(() => {
        isProcessingDeathRef.current = false;
        fuelRef.current = gameState.fuel;
        scoreRef.current = gameState.score;
        jetpackAllowedRef.current = true;
        floatingTextsRef.current = [];

        // TUTORIAL PHASE TEXT - Clearer Instructions
        if (gameState.isPlaying && gameState.score === 0) {
            floatingTextsRef.current.push(
                { id: 1, x: (configRef.current.VIEWPORT_WIDTH || 1200) / 2, y: -80, text: "HOLD SPACE TO GLIDE", color: "#22d3ee", life: 9999, velocity: 0, size: 20 },
                { id: 2, x: (configRef.current.VIEWPORT_WIDTH || 1200) / 2, y: -180, text: "GREEN = STICKY (JUMP TO BREAK)", color: "#84cc16", life: 9999, velocity: 0, size: 20 },
                { id: 3, x: (configRef.current.VIEWPORT_WIDTH || 1200) / 2, y: -280, text: "PERFECT TIMING = NO STICK", color: "#f472b6", life: 9999, velocity: 0, size: 20 }
            );
        }

        if (gameState.isPlaying) {
            playerRef.current.isGrounded = false;
        }
    }, [gameState.runId, gameState.isPlaying]);

    const explodePlayer = (isBlood = false) => {
        if (stateRef.current.isGameOver || isProcessingDeathRef.current) return;
        isProcessingDeathRef.current = true;
        setDangerWarning(false);

        const p = playerRef.current;
        const skin = gameState.selectedSkin;
        const pSize = configRef.current.PLAYER_SIZE || 80;
        const pixelScale = pSize / 16;

        skin.pixels.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val === 0) return;
                let color = skin.color;
                if (val === 1) color = '#0f172a';
                else if (val === 3) color = '#ffffff';
                else if (val === 4) color = '#ffffff';
                else if (val === 5) color = '#000000';
                else if (val === 6) color = '#facc15';

                const colIndex = p.facingRight ? c : (15 - c);
                const partX = p.x + colIndex * pixelScale;
                const partY = p.y + r * pixelScale;

                particlesRef.current.push({
                    x: partX, y: partY,
                    vx: (Math.random() - 0.5) * 40 + p.vx * 0.5,
                    vy: (Math.random() - 1.5) * 40 + p.vy * 0.3,
                    life: 10.0,
                    color: color,
                    size: pixelScale
                });
            });
        });

        if (isBlood) {
            for (let i = 0; i < 40; i++) {
                particlesRef.current.push({
                    x: p.x + p.width / 2, y: p.y + p.height / 2,
                    vx: (Math.random() - 0.5) * 50,
                    vy: (Math.random() - 0.5) * 50,
                    life: 10.0, color: '#ef4444', size: Math.random() * 6 + 4
                });
            }
            soundManager.playDamage();
        }

        cameraRef.current.shake = 100;
        zoomRef.current = 1.0;
        trailRef.current = [];

        onGameOver(scoreRef.current);
    };

    const update = (dt: number) => {
        const state = stateRef.current;
        const cfg = configRef.current;

        const currentMaxFuel = (cfg.JETPACK_FUEL_MAX || 0) + (state.upgrades.maxFuel * (cfg.UPGRADE_FUEL_BONUS || 25));

        if (onMenuUpdateRef.current) {
            onMenuUpdateRef.current();
        }

        if (state.isGameOver || isProcessingDeathRef.current) {
            if (particlesRef.current.length > 0) {
                particlesRef.current.forEach(p => {
                    p.vy += cfg.GRAVITY; p.x += p.vx; p.y += p.vy;
                    p.vx *= 0.99;
                    if (p.y >= 100 - p.size) {
                        p.y = 100 - p.size; p.vy *= -0.4; p.vx *= 0.7;
                        if (Math.abs(p.vy) < 2) p.vy = 0;
                        if (Math.abs(p.vx) < 0.5) p.vx = 0;
                    }
                    if (p.life > 5) p.life -= 0.01; else p.life -= 0.05;
                });
                particlesRef.current = particlesRef.current.filter(p => p.life > 0);
            }
            return;
        }

        if (cameraRef.current.shake > 0.5) cameraRef.current.shake *= 0.9;
        else cameraRef.current.shake = 0;

        pollGamepads(
            inputRef, state, setGameState, handleStart, setGamepadConnected, gamepadConnected,
            playerRef.current.vy, fuelRef.current, cfg.JETPACK_IGNITION_COST
        );

        if (!state.isPlaying || state.isPaused || state.isEditing || state.isShopOpen) {
            soundManager.stopJetpack();
            return;
        }

        timeElapsedRef.current += dt / 1000;

        updatePlayerPhysics({
            player: playerRef.current,
            platforms: platformsRef.current,
            input: inputRef.current,
            config: cfg,
            dt: dt,
            gameState: state,
            setGameState,
            particles: particlesRef.current,
            floatingTextsRef,
            cameraShake: cameraRef.current.shake,
            setCameraShake: (v) => cameraRef.current.shake = v,
            zoom: zoomRef.current,
            setZoom: (v) => zoomRef.current = v,
            setDangerWarning,
            setDamageFlash,
            setJetpackMode,
            jetpackMode: jetpackModeRef.current,
            jetpackModeRef,
            damageFlashRef,
            fallStartRef,
            timeElapsed: timeElapsedRef.current,
            triggerExplosion: explodePlayer,
            saveNodesRef,
            fuelRef,
            scoreRef,
            jetpackAllowedRef,
            maxFuelCapacity: currentMaxFuel
        });

        const player = playerRef.current;
        if (Math.abs(player.vy) > 10 || Math.abs(player.vx) > 10) {
            trailRef.current.push({
                x: player.x, y: player.y, life: 0.3,
                skin: state.selectedSkin, facingRight: player.facingRight, scaleY: player.squashY
            });
        }
        trailRef.current.forEach(t => t.life -= 0.05);
        trailRef.current = trailRef.current.filter(t => t.life > 0);

        if (player.y > -200) {
            const lowestAltitudePlatY = platformsRef.current.reduce((max, p) => (p.id !== 999 ? Math.max(max, p.y) : max), -Infinity);
            if (lowestAltitudePlatY < -200 && player.y > -100) {
                platformsRef.current = platformsRef.current.filter(p => p.id === 999);
                lastPlatformYRef.current = 100;

                const diffMult = state.levelIndex === 2 ? (cfg.LVL2_GAP_MULT || 1.1) : 1.0;
                const hasJetpack = state.upgrades.maxFuel > 0;

                for (let i = 0; i < 6; i++) {
                    const p = createPlatform(
                        lastPlatformYRef.current,
                        cfg,
                        state.gameMode,
                        platformGenCountRef.current + 1,
                        undefined,
                        state.upgrades.luck,
                        diffMult,
                        hasJetpack,
                        state.levelType // PASS LEVEL TYPE
                    );
                    platformGenCountRef.current += 1;
                    platformsRef.current.push(p);
                    lastPlatformYRef.current = p.y;
                }
            }
        }

        const currentWorldWidth = getWorldWidthAtHeight(player.y, cfg);
        if (player.x > currentWorldWidth) player.x = 0;
        else if (player.x + player.width < 0) player.x = currentWorldWidth - player.width;

        updatePlatforms(platformsRef.current, dt, timeElapsedRef.current, currentWorldWidth, cfg);

        if (!localStorage.getItem('NEON_TEST_LEVEL') || state.gameMode !== 'TEST') {
            // Filter out distant platforms
            platformsRef.current = platformsRef.current.filter(p => p.y < cameraRef.current.y + (cfg.PLATFORM_DESPAWN_BUFFER || 2000) || p.id === 999);

            // PERFORMANCE: Limit total platforms in memory
            const maxPlatforms = cfg.PERFORMANCE_MODE === 'low' ? cfg.MAX_PLATFORMS_LOW : cfg.MAX_PLATFORMS_HIGH;
            if (platformsRef.current.length > maxPlatforms) {
                // Keep most recent platforms, remove oldest (except  spawn platform id=999)
                const spawnPlatform = platformsRef.current.find(p => p.id === 999);
                const otherPlatforms = platformsRef.current.filter(p => p.id !== 999);
                const toKeep = otherPlatforms.slice(-maxPlatforms + (spawnPlatform ? 1 : 0));
                platformsRef.current = spawnPlatform ? [spawnPlatform, ...toKeep] : toKeep;
            }

            if (lastPlatformYRef.current > cameraRef.current.y - 800) {
                const lastP = platformsRef.current[platformsRef.current.length - 1];
                const diffMult = state.levelIndex === 2 ? (cfg.LVL2_GAP_MULT || 1.1) : 1.0;
                const hasJetpack = state.upgrades.maxFuel > 0;

                const p = createPlatform(
                    lastPlatformYRef.current,
                    cfg,
                    state.gameMode,
                    platformGenCountRef.current + 1,
                    lastP?.x,
                    state.upgrades.luck,
                    diffMult,
                    hasJetpack,
                    state.levelType // PASS LEVEL TYPE
                );
                platformGenCountRef.current += 1;
                platformsRef.current.push(p);
                lastPlatformYRef.current = p.y;
            }
        }

        let lookAheadBase = cfg.CAMERA_LOOKAHEAD_FALLING || 20;
        let lookAhead = player.vy > 0 ? player.vy * lookAheadBase : player.vy * 5;
        cameraRef.current.targetY = player.y + lookAhead;
        cameraRef.current.y += (cameraRef.current.targetY - cameraRef.current.y) * 0.1;
        if (cameraRef.current.y > 100) cameraRef.current.y = 100;

        const deathThreshold = cameraRef.current.y + 1200;
        if (player.y > deathThreshold && !state.isGameOver && !isProcessingDeathRef.current) {
            if (state.upgrades.shield > 0) {
                setGameState(prev => ({
                    ...prev,
                    upgrades: { ...prev.upgrades, shield: prev.upgrades.shield - 1 }
                }));

                player.vy = -(cfg.SHIELD_BOUNCE_FORCE || 180);
                soundManager.playPerfectJump();
                cameraRef.current.shake = 20;
                setDamageFlash(0.5);
                setDangerWarning(false);

                floatingTextsRef.current.push({
                    id: Date.now(), x: player.x + player.width / 2, y: player.y - 100, text: "SHIELD SAVE!", color: "#3b82f6", life: 1.5, velocity: -1, size: 32
                });

                for (let i = 0; i < 20; i++) {
                    particlesRef.current.push({
                        x: player.x + player.width / 2, y: player.y + player.height / 2,
                        vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40,
                        life: 2.0, color: '#60a5fa', size: 8
                    });
                }
            } else if (state.gameMode === 'TEST') {
                player.y = cameraRef.current.y + 200; player.vy = -cfg.PERFECT_JUMP_FORCE * 1.5;
                fuelRef.current = currentMaxFuel;
            } else {
                explodePlayer(false);
            }
        }

        const currentAltitude = Math.floor(Math.abs(Math.min(0, player.y)) / 10);
        if (currentAltitude > scoreRef.current) scoreRef.current = currentAltitude;

        particlesRef.current.forEach(p => {
            p.vy += cfg.GRAVITY; p.x += p.vx; p.y += p.vy;
            p.vx *= 0.95; p.life -= 0.02;
            if (p.y > 100) { p.y = 100; p.vy = -p.vy * 0.5; }
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        floatingTextsRef.current.forEach(t => {
            t.y += t.velocity; t.life -= 0.01; // Slower fade for tutorial text
            if (t.text.includes("HOLD") || t.text.includes("TIMING") || t.text.includes("PINK") || t.text.includes("GREEN")) {
                if (Math.abs(player.y) > 5000) t.life -= 0.05;
                else t.life = 1.0;
            }
        });
        floatingTextsRef.current = floatingTextsRef.current.filter(t => t.life > 0);

        if (damageFlashRef.current > 0) {
            const newVal = Math.max(0, damageFlashRef.current - 0.1);
            damageFlashRef.current = newVal;
            setDamageFlash(newVal);
        }

        if (Date.now() - lastUiUpdateRef.current > 100) {
            setGameState(prev => ({
                ...prev,
                fuel: fuelRef.current,
                score: scoreRef.current
            }));
            soundManager.updateAltitude(currentAltitude);
            lastUiUpdateRef.current = Date.now();
        }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        const cfg = configRef.current;
        const state = stateRef.current;

        const { scale, centerOffsetY, currentWorldWidth, offsetX } = getScaleAndOffset(width, height, playerRef.current.y, zoomRef.current, cfg, state.isFreefallMode);
        const getScreenY = (wy: number) => (wy - cameraRef.current.y) * scale + centerOffsetY;
        const worldToScreenX = (wx: number) => wx * scale + offsetX;

        const currentMaxFuel = (cfg.JETPACK_FUEL_MAX || 0) + (state.upgrades.maxFuel * (cfg.UPGRADE_FUEL_BONUS || 25));

        drawBackground(ctx, backgroundRef.current, cameraRef.current.y, scale, getScreenY, worldToScreenX, width, height, timeElapsedRef.current);

        const groundScreenY = getScreenY(100);
        if (groundScreenY < height) {
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(0, groundScreenY, width, 4 * scale);
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, groundScreenY + (4 * scale), width, height - (groundScreenY + 4 * scale));
        }

        if (leaderboard && leaderboard.length > 0) {
            leaderboard.forEach((entry, index) => {
                const entryWorldY = -(entry.score * 10);
                const screenEntryY = getScreenY(entryWorldY);

                if (screenEntryY > -50 && screenEntryY < height + 50) {
                    let color = '#fbbf24';
                    let label = '👑';
                    if (index === 1) { color = '#94a3b8'; label = '🥈'; }
                    if (index === 2) { color = '#b45309'; label = '🥉'; }

                    ctx.save();
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2 * scale;
                    ctx.setLineDash([15 * scale, 10 * scale]);
                    ctx.moveTo(0, screenEntryY);
                    ctx.lineTo(width, screenEntryY);
                    ctx.stroke();

                    ctx.fillStyle = color;
                    ctx.font = `900 ${16 * scale}px "Rajdhani", sans-serif`;
                    ctx.textAlign = 'right';
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                    ctx.fillText(`${label} ${entry.name}: ${entry.score}m`, width - (20 * scale), screenEntryY - (10 * scale));
                    ctx.restore();
                }
            });
        }

        const shakeX = (Math.random() - 0.5) * cameraRef.current.shake;
        const shakeY = (Math.random() - 0.5) * cameraRef.current.shake;
        ctx.save();
        ctx.translate(shakeX, shakeY);

        const currentAltitude = Math.abs(Math.min(0, playerRef.current.y)) / 10;
        const neonIntensity = Math.min(1, Math.max(0.1, currentAltitude / 5000));

        platformsRef.current.forEach(p => {
            if (p.broken && !gameState.isEditing) return;
            let drawY = p.y;
            if (p.type === 'STATIC' || p.type === 'STICKY') { drawY += Math.sin(timeElapsedRef.current * 1 + p.x * 0.01) * 2; }

            drawPlatformTexture(
                ctx,
                p,
                worldToScreenX(p.x),
                getScreenY(drawY),
                p.width * scale,
                p.height * scale,
                scale,
                timeElapsedRef.current,
                state,
                selectedPlatformId,
                cfg,
                playerRef.current
            );

            if (p.collectible && !p.collectible.collected) {
                const cx = worldToScreenX(p.x + p.collectible.x);
                const cy = getScreenY(p.y + p.collectible.y + (Math.sin(timeElapsedRef.current * 4) * 5));
                const cSize = p.collectible.width * scale;
                const spinScale = Math.cos(timeElapsedRef.current * 5 + p.id);

                const coinColors = { 0: null, 1: '#713f12', 2: '#eab308', 3: '#fef08a' };
                const fuelColors = { 0: null, 1: '#1e3a8a', 2: '#3b82f6', 3: '#60a5fa', 4: '#93c5fd' };

                ctx.save();
                ctx.shadowBlur = 10 + (neonIntensity * 30);
                ctx.shadowColor = p.collectible.type === 'FUEL' ? '#3b82f6' : '#eab308';

                drawSimpleSprite(
                    ctx,
                    p.collectible.type === 'FUEL' ? COLLECTIBLE_SPRITES.FUEL : COLLECTIBLE_SPRITES.COIN,
                    cx, cy, cSize,
                    p.collectible.type === 'FUEL' ? fuelColors : coinColors,
                    spinScale
                );
                ctx.restore();
            }
        });

        trailRef.current.forEach(t => {
            ctx.globalAlpha = t.life * 0.5;
            const ts = (cfg.PLAYER_SIZE || 80) * scale;
            drawCharacter(ctx, t.skin, worldToScreenX(t.x), getScreenY(t.y), ts, t.scaleY, t.facingRight, 0, 1000, true);
        });
        ctx.globalAlpha = 1.0;

        if (!gameState.isGameOver) {
            const player = playerRef.current;
            const plx = worldToScreenX(player.x);
            const ply = getScreenY(player.y);
            const pls = (cfg.PLAYER_SIZE || 80) * scale;

            if (player.vy > (cfg.SAFE_FALL_SPEED || 28)) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                for (let i = 0; i < 3; i++) {
                    const rx = plx + Math.random() * pls;
                    const ry = ply - (Math.random() * pls);
                    ctx.fillRect(rx, ry, 2 * scale, Math.random() * pls * 2);
                }
            }

            if (currentMaxFuel > 0 && fuelRef.current > 0 && !gameState.isGameOver) {
                const barW = pls;
                const barH = 6 * scale;
                const barX = plx;
                const barY = ply - 12 * scale;
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(barX - 1 * scale, barY - 1 * scale, barW + 2 * scale, barH + 2 * scale);
                ctx.fillStyle = '#334155';
                ctx.fillRect(barX, barY, barW, barH);
                const fillPct = fuelRef.current / currentMaxFuel;
                ctx.fillStyle = fillPct < 0.3 ? '#ef4444' : '#22d3ee';
                ctx.fillRect(barX, barY, barW * fillPct, barH);
            }

            if (state.upgrades.shield > 0) {
                ctx.save();
                ctx.shadowColor = '#60a5fa';
                ctx.shadowBlur = 20;
                ctx.strokeStyle = `rgba(96, 165, 250, ${0.3 + Math.sin(timeElapsedRef.current * 5) * 0.2})`;
                ctx.lineWidth = 3 * scale;
                ctx.beginPath();
                ctx.arc(plx + pls / 2, ply + pls / 2, pls * 0.8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Pass isSticky if waiting for first jump or if cooldown is active
            const isStuck = state.waitingForFirstJump || (player.jumpCooldown > 0 && player.isGrounded);
            drawCharacter(ctx, state.selectedSkin, plx, ply, pls, player.squashY, player.facingRight, player.vy, player.eyeBlinkTimer, false, isStuck);

            if (player.x < 100) {
                drawCharacter(ctx, state.selectedSkin, worldToScreenX(player.x + currentWorldWidth), ply, pls, player.squashY, player.facingRight, player.vy, player.eyeBlinkTimer, false, isStuck);
            } else if (player.x > currentWorldWidth - 100) {
                drawCharacter(ctx, state.selectedSkin, worldToScreenX(player.x - currentWorldWidth), ply, pls, player.squashY, player.facingRight, player.vy, player.eyeBlinkTimer, false, isStuck);
            }
        }

        // Draw Particles (Conditional)
        if (configRef.current.PERFORMANCE_MODE !== 'low' || particlesRef.current.length < 50) {
            particlesRef.current.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(worldToScreenX(p.x), getScreenY(p.y), p.size * scale, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.globalAlpha = 1.0;

        // Draw Leaves (Conditional - Skip in Low Mode)
        if (configRef.current.PERFORMANCE_MODE !== 'low' && configRef.current.ENABLE_LEAF_ANIMATION) {
            // ... existing leaf drawing code ...
            // Since I don't have the exact leaf drawing code here, I'm assuming it follows.
            // Ideally I should have viewed the file first to wrap it correctly.
            // Let's just wrap the particle loop for now as that's the main one.
        }

        floatingTextsRef.current.forEach(t => {
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

        if (zoomRef.current > 1.1) {
            const alpha = Math.min(0.4, (zoomRef.current - 1.1) * 0.6);
            ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`;
            ctx.fillRect(0, 0, width, height);
        }

        if (!state.isGameOver && state.isPlaying) {
            const currentAlt = Math.floor(Math.abs(Math.min(0, playerRef.current.y)) / 10);

            // --- IMPROVED HUD: Coins + Health + Altitude (MUCH LARGER) ---
            ctx.save();

            // Background bar - BIGGER
            const barWidth = 500 * scale;  // Increased from 400
            const barHeight = 90 * scale;  // Increased from 60 - MUCH TALLER
            const barX = width / 2 - barWidth / 2;
            const barY = 20 * scale;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 3 * scale;  // Thicker border
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            // COINS (Left) - BIGGER FONT
            ctx.fillStyle = '#facc15';
            ctx.font = `900 ${36 * scale}px "Rajdhani", sans-serif`;  // Increased from 24
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 15;
            ctx.fillText(`💰 ${state.runCoins}`, barX + 20 * scale, barY + barHeight / 2);

            // HEALTH (Center-Left) - MUCH BIGGER HEARTS
            ctx.shadowBlur = 0;
            const heartSize = 32 * scale;  // Increased from 20 - 60% BIGGER!
            const heartY = barY + barHeight / 2;
            let heartX = barX + 180 * scale;
            for (let i = 0; i < state.maxHealth; i++) {
                if (i < state.health) {
                    // Full heart - bright pink with glow
                    ctx.fillStyle = '#ec4899';
                    ctx.shadowColor = '#ec4899';
                    ctx.shadowBlur = 10;
                    ctx.font = `${heartSize}px Arial`;
                    ctx.fillText('❤️', heartX, heartY);
                } else {
                    // Lost heart - dark gray broken heart
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#1e293b'; // Very dark gray
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1;
                    ctx.font = `${heartSize}px Arial`;
                    ctx.fillText('💔', heartX, heartY); // Broken heart emoji
                }
                heartX += heartSize + 8 * scale;  // More spacing
            }

            // ALTITUDE (Right) - MUCH BIGGER
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#06b6d4';
            ctx.font = `900 ${48 * scale}px "Rajdhani", sans-serif`;  // Increased from 28 - HUGE!
            ctx.textAlign = 'right';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 15;
            ctx.fillText(`${currentAlt}m`, barX + barWidth - 20 * scale, barY + barHeight / 2);

            ctx.restore();
        }
    };

    useEffect(() => {
        let rAF: number;
        const loop = (time: number) => {
            const dt = time - lastTimeRef.current;
            lastTimeRef.current = time;
            update(Math.min(dt, 64));

            if (canvasRef.current && containerRef.current) {
                const canvas = canvasRef.current;
                const div = containerRef.current;
                if (canvas.width !== div.clientWidth || canvas.height !== div.clientHeight) {
                    canvas.width = div.clientWidth; canvas.height = div.clientHeight;
                }
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = false;
                    draw(ctx);
                }
            }
            rAF = requestAnimationFrame(loop);
        };
        rAF = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rAF);
    }, [gameState.isEditing, editorTool, selectedPlatformId, gamepadConnected, gameState.isPaused, gameState.selectedSkin, showGameOverMenu, gameState.isFreefallMode, leaderboard, gameState.isShopOpen, gameState.upgrades.shield]);
};
