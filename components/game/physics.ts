
import React from 'react';
import { Player, Platform, GameState, Particle, PlatformType, GameConfig, SaveNode, FloatingText } from '../../types';
import { spawnParticles } from './utils';
import { soundManager } from './audioManager';
import * as Constants from '../../constants';

interface PhysicsUpdateProps {
    player: Player & { squashX: number, squashY: number, facingRight: boolean };
    platforms: Platform[];
    input: { left: boolean, right: boolean, jetpack: boolean, jumpIntent: boolean, jumpPressedTime: number, tiltX: number };
    config: GameConfig;
    dt: number;
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    // Debug: store last safe platform Y for shield teleport
    lastSafePlatform?: { current: number };
    // Debug: reference for safe platform tracking
    lastSafePlatformRef?: React.MutableRefObject<number>;
    particles: Particle[];
    floatingTextsRef: React.MutableRefObject<FloatingText[]>;
    cameraShake: number;
    setCameraShake: (v: number) => void;
    zoom: number;
    setZoom: (v: number) => void;
    setDangerWarning: (v: boolean) => void;
    setDamageFlash: (v: number) => void;
    setJetpackMode: (v: 'IDLE' | 'BURST' | 'GLIDE') => void;
    jetpackMode: 'IDLE' | 'BURST' | 'GLIDE';
    jetpackModeRef: React.MutableRefObject<'IDLE' | 'BURST' | 'GLIDE'>;
    jetpackAllowedRef: React.MutableRefObject<boolean>;
    damageFlashRef: React.MutableRefObject<number>;
    fallStartRef: React.MutableRefObject<number | null>;
    timeElapsed: number;
    triggerExplosion: (isBlood: boolean) => void;
    saveNodesRef: React.MutableRefObject<SaveNode[]>;
    fuelRef: React.MutableRefObject<number>;
    scoreRef: React.MutableRefObject<number>;
    maxFuelCapacity: number;
}

export const updatePlayerPhysics = (props: PhysicsUpdateProps): void => {
    const {
        player, platforms, input, config, gameState, setGameState,
        particles, floatingTextsRef, setCameraShake, zoom, setZoom, setDangerWarning,
        setDamageFlash, setJetpackMode, jetpackModeRef, damageFlashRef,
        fallStartRef, timeElapsed, triggerExplosion, saveNodesRef,
        fuelRef, scoreRef, jetpackAllowedRef, maxFuelCapacity
    } = props;

    const cfg = config;
    // Normalize to 60 FPS with clamping to prevent extreme values
    const rawTimeScale = props.dt / (1000 / 60);
    const timeScale = Math.min(Math.max(rawTimeScale, 0.1), 3.0); // Clamp between 0.1 and 3.0

    // Safety check for NaN values in player state
    if (isNaN(player.x) || isNaN(player.y) || isNaN(player.vx) || isNaN(player.vy)) {
        player.x = (cfg.VIEWPORT_WIDTH || 1200) / 2;
        player.y = 0;
        player.vx = 0;
        player.vy = 0;
        console.warn('Physics: Reset player due to NaN values');
        return;
    }

    // --- JUMP COOLDOWN (ANTI-SPAM) ---
    if (player.jumpCooldown > 0) {
        player.jumpCooldown -= props.dt;
    }

    // --- STICKY START LOGIC (Player Glued to Ground) ---
    if (gameState.waitingForFirstJump) {
        player.vx = 0;
        player.vy = 0;
        player.y = 100 - player.height; // Lock to ground level
        player.isGrounded = true;
        player.squashX = 1.0 + Math.sin(timeElapsed * 5) * 0.05; // Idle breathe
        player.squashY = 1.0 - Math.sin(timeElapsed * 5) * 0.05;

        const center = (cfg.VIEWPORT_WIDTH || 1200) / 2 - player.width / 2;
        player.x = center;

        if ((input.jumpIntent || input.jetpack) && player.jumpCooldown <= 0) {
            setGameState(prev => ({ ...prev, waitingForFirstJump: false }));

            spawnParticles(particles, player.x + player.width / 2, player.y + player.height, 12, '#84cc16', true, cfg);
            soundManager.playJump();
            player.vy = -cfg.WEAK_JUMP_FORCE;
            player.isGrounded = false;
            player.jumpCooldown = cfg.JUMP_COOLDOWN_MS;
        }
        return;
    }

    // 1. Movement (Horizontal)
    const useTilt = gameState.mobileControlMode === 'TILT';

    if (useTilt) {
        if (Math.abs(input.tiltX) > 0.05) {
            player.vx += input.tiltX * cfg.MOVE_ACCELERATION * timeScale;
            player.facingRight = input.tiltX > 0;
        }
    } else {
        if (input.left) { player.vx -= cfg.MOVE_ACCELERATION * timeScale; player.facingRight = false; }
        if (input.right) { player.vx += cfg.MOVE_ACCELERATION * timeScale; player.facingRight = true; }
    }

    // Friction application (Exponential decay needs timeScale in power)
    player.vx *= Math.pow(cfg.FRICTION, timeScale);

    const maxH = cfg.MAX_H_SPEED || 15;
    player.vx = Math.max(-maxH, Math.min(maxH, player.vx));

    player.squashX += (1 - player.squashX) * 0.1 * timeScale;
    player.squashY += (1 - player.squashY) * 0.1 * timeScale;

    // 2. Vertical Logic
    if (player.vy > 0) {
        if (fallStartRef.current === null) fallStartRef.current = player.y;
        const fallDistance = player.y - fallStartRef.current;
        const isFastFall = player.vy > (cfg.SAFE_FALL_SPEED || 55);

        if (fallDistance > 2500) {
            setDangerWarning(true);
            if (zoom < 1.6) setZoom(zoom + 0.02 * timeScale);
        } else if (isFastFall) {
            setCameraShake(Math.max(props.cameraShake, 2.0));
            setDangerWarning(false);
        } else {
            setDangerWarning(false);
        }
    } else {
        fallStartRef.current = null;
        setDangerWarning(false);
        if (zoom > 1.0) setZoom(Math.max(1.0, zoom - 0.05 * timeScale));
    }

    // 3. Gravity & Resistance
    player.vy += cfg.GRAVITY * timeScale;

    if (player.vy < 0) {
        const aeroLevel = gameState.upgrades.aerodynamics;
        const riseFactor = (cfg.AIR_RESISTANCE_RISE || 0.92) + (aeroLevel * cfg.UPGRADE_AERODYNAMICS_BONUS);
        player.vy *= Math.pow(Math.min(0.995, riseFactor), timeScale);
    } else {
        player.vy *= Math.pow(cfg.AIR_RESISTANCE, timeScale);
    }

    // 4. Jetpack Logic
    if (!input.jetpack) {
        jetpackAllowedRef.current = true;
    }

    let currentMode: 'IDLE' | 'BURST' | 'GLIDE' = 'IDLE';

    if (input.jetpack && jetpackAllowedRef.current && fuelRef.current > 0 && maxFuelCapacity > 0) {
        let force = cfg.JETPACK_FORCE;
        let fuelCost = cfg.JETPACK_FUEL_COST_PER_FRAME * timeScale;

        if (player.vy > 0) {
            currentMode = 'BURST';
            force = cfg.JETPACK_FORCE * 2.5;
            fuelCost = cfg.JETPACK_FUEL_COST_PER_FRAME * 4.0 * timeScale;
        } else {
            currentMode = 'GLIDE';
            if (player.vy < -10) {
                force = cfg.GRAVITY * 0.8;
            } else {
                force = cfg.GRAVITY * 1.2;
            }
            fuelCost = cfg.JETPACK_FUEL_COST_PER_FRAME * 0.5 * timeScale;
        }
        player.vy -= force * timeScale;
        if (player.vy < 0) { player.squashX = 0.9; player.squashY = 1.1; }

        fuelRef.current = Math.max(0, fuelRef.current - fuelCost);

        if (fuelRef.current <= 0) {
            jetpackAllowedRef.current = false;
            soundManager.stopJetpack();
        } else {
            soundManager.startJetpack();
        }

        if (Math.random() > 0.5) {
            const isBurst = currentMode === 'BURST';
            const pColor = isBurst ? '#f97316' : '#22d3ee';
            particles.push({
                x: player.x + player.width / 2 + (Math.random() - 0.5) * (player.width * 0.4),
                y: player.y + player.height * 0.8,
                vx: player.vx * 0.5 + (Math.random() - 0.5) * 10,
                vy: 15 + Math.random() * 15,
                life: 0.4 + Math.random() * 0.3,
                color: pColor,
                size: 4 + Math.random() * 4
            });
        }
    } else {
        soundManager.stopJetpack();
    }

    player.vy = Math.max(Math.min(player.vy, cfg.MAX_FALL_SPEED), cfg.MAX_RISE_SPEED);

    // 5. Position
    player.x += player.vx * timeScale;
    const prevY = player.y;
    player.y += player.vy * timeScale;
    player.isGrounded = false;

    // --- PLATFORM & COLLECTIBLE COLLISIONS ---
    const feet = player.y + player.height;
    const prevFeet = prevY + player.height;

    for (const p of platforms) {
        // Skip invalid platforms
        if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') continue;
        
        if (p.collectible && !p.collectible.collected) {
            const cX = p.x + p.collectible.x + p.collectible.width / 2;
            const cY = p.y + p.collectible.y + p.collectible.height / 2;
            const pCenterX = player.x + player.width / 2;
            const pCenterY = player.y + player.height / 2;

            const dist = Math.sqrt((cX - pCenterX) ** 2 + (cY - pCenterY) ** 2);
            // Improved collision radius calculation
            const collisionRadius = Math.max(player.width / 2, p.collectible.width) * 0.8;
            if (dist < collisionRadius) {
                p.collectible.collected = true;
                if (p.collectible.type === 'FUEL') {
                    const refillAmount = cfg.FUEL_REFILL_AMOUNT;
                    fuelRef.current = Math.min(maxFuelCapacity, fuelRef.current + refillAmount);
                    soundManager.playCollect();
                    spawnParticles(particles, cX, cY, 15, '#3b82f6', true, cfg);
                    floatingTextsRef.current.push({
                        id: Date.now() + Math.random(), x: cX, y: cY, text: "FUEL", color: "#3b82f6", life: 1.0, velocity: -2, size: 20
                    });
                } else {
                    setGameState(prev => ({ ...prev, runCoins: prev.runCoins + cfg.COIN_VALUE }));
                    soundManager.playCollect();
                    spawnParticles(particles, cX, cY, 15, '#eab308', true, cfg);
                    floatingTextsRef.current.push({
                        id: Date.now() + Math.random(), x: cX, y: cY, text: `+ ${cfg.COIN_VALUE}`, color: "#facc15", life: 1.0, velocity: -2, size: 24
                    });
                }
            }
        }

        if (player.vy >= 0) {
            if (p.broken) {
                continue;
            }

            let yOffset = 0;
            if (p.type === PlatformType.STATIC || p.type === PlatformType.STICKY) {
                yOffset = Math.sin(timeElapsed * 1 + p.x * 0.01) * 5;
            }
            const platformTop = p.y + yOffset;
            // Improved horizontal collision detection with better margins
            const playerLeft = player.x + player.width * 0.15;
            const playerRight = player.x + player.width * 0.85;
            const inX = playerRight > p.x && playerLeft < p.x + p.width;
            // Improved vertical crossing detection with velocity-based tolerance
            const velocityTolerance = Math.max(15, Math.abs(player.vy) * 0.5);
            const crossedPlatform = prevFeet <= platformTop + velocityTolerance && feet >= platformTop - 5;


            if (inX && crossedPlatform) {
                let damage = 0;
                let triggerBlood = false;

                if (gameState.gameMode !== 'TEST') {
                    // === PHYSICS-BASED FALL DAMAGE SYSTEM ===
                    // Track fall distance from last platform
                    const fallDistance = fallStartRef.current !== null ? (player.y - fallStartRef.current) : 0;
                    const impactVelocity = player.vy;

                    // Mathematical thresholds (TUNED for slow gravity 0.65)
                    const DEATH_VELOCITY = 55;        // Realistic instant death (was 50)
                    const DANGER_VELOCITY = 40;       // 1 heart damage (was 35)
                    const LONG_FALL_DISTANCE = 800;   // Long fall threshold (was 1200 - more responsive)
                    // RULE 1: INSTANT DEATH - Critical velocity (free fall from very high)
                    if (impactVelocity >= DEATH_VELOCITY) {
                        if (gameState.upgrades.shield > 0) {
                            // SHIELD SAVE: Teleport to last safe platform!
                            const lastPlatform = props.lastSafePlatform?.current;
                            const safeY = lastPlatform !== undefined ? lastPlatform : player.y - 300;

                            setGameState(prev => ({ ...prev, upgrades: { ...prev.upgrades, shield: prev.upgrades.shield - 1 } }));

                            // Teleport ON TOP of last platform
                            player.y = safeY - player.height - 5; // Just above platform surface
                            player.vy = -15; // Small upward bounce
                            player.vx = player.vx * 0.5;
                            player.isGrounded = false;

                            soundManager.playPerfectJump();
                            setCameraShake(40);
                            setDamageFlash(0.9);
                            setDangerWarning(false);

                            // Massive visual feedback
                            spawnParticles(particles, player.x + player.width / 2, player.y, 60, '#3b82f6', true, cfg);
                            spawnParticles(particles, player.x + player.width / 2, player.y, 40, '#ffffff', true, cfg);
                            floatingTextsRef.current.push({
                                id: Date.now(), x: player.x + player.width / 2, y: player.y - 120,
                                text: "🛡️ SAVED!", color: "#3b82f6", life: 2.5, velocity: -3, size: 44
                            });

                            // Reset fall tracker
                            fallStartRef.current = null;
                            return;
                        }
                        // No shield = death
                        damage = cfg.MAX_HEALTH;
                        triggerBlood = true;
                    }
                    // RULE 2: DANGEROUS FALL - High velocity OR long fall distance
                    else if (impactVelocity >= DANGER_VELOCITY || fallDistance >= LONG_FALL_DISTANCE) {
                        // Take 1 heart damage
                        damage = 1;
                        floatingTextsRef.current.push({
                            id: Date.now(), x: player.x + player.width / 2, y: player.y - 80,
                            text: "HARD LANDING!", color: "#ef4444", life: 1.0, velocity: -2, size: 24
                        });
                    }
                    // RULE 3: SAFE LANDING - Low velocity and short fall = no damage
                    else {
                        // No damage
                    }
                }

                if (damage > 0 && !gameState.godMode) { // God mode prevents damage
                    const newHealth = Math.max(0, gameState.health - damage);
                    setGameState(prev => ({ ...prev, health: newHealth }));
                    if (newHealth <= 0) {
                        setDangerWarning(false);
                        triggerExplosion(triggerBlood);
                        return;
                    } else {
                        setCameraShake(30);
                        damageFlashRef.current = 1.0;
                        setDamageFlash(1.0);
                        soundManager.playDamage();
                    }
                } else if (player.vy > 30) {
                    setCameraShake(5);
                }

                player.y = platformTop - player.height;
                player.vy = 0;
                player.isGrounded = true;
                player.jumpCooldown = 0;
                fallStartRef.current = null;

                // FIX #2: Store last safe platform Y for shield teleport
                if (!props.lastSafePlatform) props.lastSafePlatform = { current: platformTop };
                else props.lastSafePlatform.current = platformTop;

                setDangerWarning(false);
                const canJump = player.jumpCooldown <= 0;
                const timeSincePress = Date.now() - input.jumpPressedTime;
                const perfectTiming = timeSincePress < (cfg.PARRY_WINDOW_MS || 135);
                const perfect = canJump && perfectTiming;

                const jumpBonus = gameState.upgrades.jump * cfg.UPGRADE_JUMP_BONUS;
                const baseJump = perfect ? cfg.PERFECT_JUMP_FORCE : cfg.WEAK_JUMP_FORCE;

                if (p.type === PlatformType.STICKY && !perfect) {
                    // --- CRUMBLE TRIGGER ---
                    if (p.maxCrumbleTimer && !p.isCrumbling) {
                        p.isCrumbling = true;
                    }

                    player.vx = 0;
                    player.vy = 0;
                    if (input.jumpIntent && canJump) {
                        player.vy = -(baseJump + jumpBonus);
                        player.jumpCooldown = cfg.JUMP_COOLDOWN_MS;
                        spawnParticles(particles, p.x + p.width / 2, p.y + 10, 10, '#84cc16', true, cfg);
                        soundManager.playJump();
                    }
                } else if (p.type === PlatformType.LATERAL_BOUNCE) {
                    // --- LATERAL BOUNCE (PARABOLIC ARC) ---
                    const playerCenter = player.x + player.width / 2;
                    const platformCenter = p.x + p.width / 2;
                    const direction = playerCenter < platformCenter ? -1 : 1; // Left or Right

                    const angleInDegrees = Math.random() * 30 + 30; // 30° to 60°
                    const angleInRadians = angleInDegrees * (Math.PI / 180);
                    const magnitude = 80;

                    player.vx = direction * Math.cos(angleInRadians) * magnitude;
                    player.vy = -Math.sin(angleInRadians) * magnitude; // Negative = upward

                    // Visual feedback
                    // Debug hitbox for enemy/tile
                    if (gameState.showHitboxes) {
                        // Note: ctx, t.skin, worldToScreenX, getScreenY, ts, etc. are not available in updatePlayerPhysics.
                        // This code snippet seems intended for a rendering loop (e.g., useGameLoop).
                        // Inserting as-is per instruction, but it will cause a runtime error.
                        // ctx.strokeStyle = '#ff00ff';
                        // ctx.lineWidth = 1;
                        // ctx.strokeRect(worldToScreenX(t.x), getScreenY(t.y), ts, ts);
                    }
                    spawnParticles(particles, platformCenter, p.y, 20, p.color, true, cfg);
                    soundManager.playPerfectJump();
                    setCameraShake(15);
                    floatingTextsRef.current.push({
                        id: Date.now(), x: platformCenter, y: p.y - 50,
                        text: direction > 0 ? "→ →" : "← ←",
                        color: "#f97316", life: 1.0, velocity: -3, size: 32
                    });
                } else {
                    let bounceForce = baseJump;
                    if (!input.jumpIntent) {
                        bounceForce = cfg.WEAK_JUMP_FORCE * 0.8;
                    } else {
                        bounceForce = baseJump + jumpBonus;
                    }
                    player.vy = -bounceForce;
                }

                if (player.vy < 0) {
                    spawnParticles(particles, p.x + p.width / 2, p.y + p.height / 2, 10, p.color, true, cfg);
                    soundManager.playPlatformImpact();

                    if (perfect) {
                        soundManager.playPerfectJump();
                        setCameraShake(10);
                        setGameState(prev => ({ ...prev, combo: prev.combo + 1, hitStop: 4 }));
                        spawnParticles(particles, p.x + p.width / 2, p.y, 12, '#f472b6', true, cfg);
                    }

                    if (p.id !== 999) { p.broken = true; p.respawnTimer = 0; }
                }

                if (maxFuelCapacity > 0) {
                    fuelRef.current = Math.min(maxFuelCapacity, fuelRef.current + (cfg.FUEL_REGEN_ON_LAND || 20) * timeScale);
                }
                return;
            }
        }
    }
};
