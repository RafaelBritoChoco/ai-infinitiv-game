import React, { useEffect, useRef } from 'react';
import { GameState, Player, Platform, Particle, CharacterSkin, GameConfig, SaveNode, LeaderboardEntry, FloatingText } from '../../types';
import { PetBuffs } from '../../pet-types';
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
import { renderGame, RenderContext } from './loops/renderSystem';
import { useTutorialSystem } from './hooks/useTutorialSystem';

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
    localLeaderboard?: LeaderboardEntry[]; // NEW PROP
    localLeaderboardRef?: React.MutableRefObject<LeaderboardEntry[]>; // NEW PROP
    highScoreEntryStatusRef: React.MutableRefObject<'NONE' | 'PENDING' | 'SUBMITTED'>;
    onGameOver: (score: number) => void;
    onMenuUpdate?: () => void;
    weedMode?: boolean;
    showTutorial?: boolean;
    showDebug?: boolean;
    petBuffs: PetBuffs | null;
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
        jetpackModeRef, damageFlashRef, leaderboard, leaderboardRef, localLeaderboard, localLeaderboardRef, jetpackAllowedRef,
        highScoreEntryStatusRef, onGameOver, onMenuUpdate, weedMode, showTutorial, showDebug, petBuffs
    } = props;

    const lastTimeRef = useRef<number>(0);
    const lastUiUpdateRef = useRef<number>(0);
    const isProcessingDeathRef = useRef<boolean>(false);

    // Fixed Timestep & Debug Refs
    const accumulatorRef = useRef<number>(0);
    const frameCountRef = useRef<number>(0);
    const lastSafePlatformYRef = useRef<number>(0);
    const lastFpsUpdateRef = useRef<number>(0);
    const fpsRef = useRef<number>(0);
    const lastInitializedStepRef = useRef<number>(-1); // Track tutorial step init

    const fuelRef = useRef<number>(configRef.current.JETPACK_STARTING_FUEL || 0);
    const scoreRef = useRef<number>(0);

    const floatingTextsRef = useRef<FloatingText[]>([]);

    // Track which records have been passed (to show celebration effect once)
    const passedRecordsRef = useRef<Set<string>>(new Set());
    const recordCelebrationRef = useRef<{ active: boolean; rank: number; timer: number; position: number }>({ active: false, rank: 0, timer: 0, position: 0 });

    const onMenuUpdateRef = useRef(onMenuUpdate);
    useEffect(() => { onMenuUpdateRef.current = onMenuUpdate; }, [onMenuUpdate]);

    useEffect(() => {
        // Reset passed records ONLY when starting a new game (runId changes)
        // Do NOT reset when leaderboard updates, or standing on a record line will trigger "ghost hits"
    }, []); // Empty dependency array - logic moved to runId effect below

    useEffect(() => {
        isProcessingDeathRef.current = false;
        fuelRef.current = gameState.fuel;
        scoreRef.current = gameState.score;
        jetpackAllowedRef.current = true;
        floatingTextsRef.current = [];

        // Reset passed records when starting a new game
        passedRecordsRef.current = new Set();
        recordCelebrationRef.current = { active: false, rank: 0, timer: 0, position: 0 };

        if (gameState.isPlaying) {
            playerRef.current.isGrounded = false;

        } else if (!gameState.isGameOver) {
            const startY = -(gameState.maxAltitude || 0) * 10;
            if (startY < -1000) {
                playerRef.current.y = startY;
                playerRef.current.vy = 0;
                cameraRef.current.y = startY - 200;
                lastPlatformYRef.current = startY + 200;
                platformsRef.current = [];
                platformGenCountRef.current = Math.floor(Math.abs(startY) / 100);
            }
        }

        // Apply Pet Shield Buff on Start
        if (gameState.isPlaying && petBuffs?.shieldOnStart && gameState.score === 0 && gameState.upgrades.shield === 0) {
            // Only apply if score is 0 (fresh start) and no shield yet
            setGameState(prev => ({
                ...prev,
                upgrades: { ...prev.upgrades, shield: 1 }
            }));
            // Visual feedback could be added here
        }
    }, [gameState.runId, gameState.isPlaying, gameState.isGameOver]);

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

        if (!state.isPlaying || state.isPaused || state.isEditing || state.isShopOpen || showTutorial) {
            soundManager.stopJetpack();
            return;
        }

        timeElapsedRef.current += dt / 1000;

        // TUTORIAL SLOW MOTION
        let physicsDt = dt;
        if (gameState.gameMode === 'TUTORIAL' && gameState.tutorialStep === 2) { // Step 2 = Perfect Jump
            const p = playerRef.current;
            // Slow down when falling and close to ground (simulating the "Zone")
            // Platform is at 100 (from init). Player y > 0 means below start? No, y is inverted? 
            // Wait, y=100 is below. 0 is top.
            // Let's check init: y=100 is the floor. Player starts at 0. Gravity pulls down (positive vy).
            // So if p.y > -50 (close to 100) and p.vy > 0 (falling)
            if (p.y > -50 && p.vy > 0) {
                physicsDt = dt * 0.2; // 20% speed
            }
        }

        const p = playerRef.current; // Player reference for tutorial logic

        // TUTORIAL PROGRESSION
        if (state.gameMode === 'TUTORIAL' && state.tutorialPhase === 'PLAYING') {
            const step = state.tutorialStep || 0;
            const p = playerRef.current;

            if (step === 0) {
                // FASE 1: MOVIMENTO - Moveu 150px em qualquer direção
                if (Math.abs(p.x) > 150) {
                    setGameState(prev => ({ ...prev, tutorialPhase: 'COMPLETED' }));
                }
            } else if (step === 1) {
                // FASE 2: PULO - Aterrissou na segunda plataforma (x > 30)
                if (p.x > 50 && p.isGrounded) {
                    setGameState(prev => ({ ...prev, tutorialPhase: 'COMPLETED' }));
                }
                // Reset se cair
                if (p.y > 300) {
                    setGameState(prev => ({ ...prev, tutorialPhase: 'INSTRUCTION' }));
                }
            } else if (step === 2) {
                // FASE 3: PERFECT JUMP - Atravessou o gap grande (x > 100)
                if (p.x > 120 && p.isGrounded) {
                    setGameState(prev => ({ ...prev, tutorialPhase: 'COMPLETED' }));
                }
                // Reset se cair
                if (p.y > 300) {
                    setGameState(prev => ({ ...prev, tutorialPhase: 'INSTRUCTION' }));
                }
            } else if (step === 3) {
                // FASE 4: JETPACK - Chegou na plataforma alta (y < -150)
                if (p.y < -150 && p.isGrounded) {
                    setGameState(prev => ({ ...prev, tutorialPhase: 'COMPLETED' }));
                }
            } else if (step === 4) {
                // FASE 5: CHALLENGE - Chegou em 500m
                const altitude = Math.floor(Math.abs(p.y) / 10);
                if (altitude >= 500) {
                    // Tutorial completo!
                    localStorage.setItem('TUTORIAL_COMPLETED', 'true');
                    setGameState(prev => ({ ...prev, tutorialPhase: 'COMPLETED' }));
                }
            }
        }

        // TUTORIAL PHASE LOGIC
        // If in INSTRUCTION or COMPLETED phase, PAUSE PHYSICS
        if (state.gameMode === 'TUTORIAL' && state.tutorialPhase !== 'PLAYING') {
            // Freeze game loop, only overlay can trigger state changes
            return;
        }

        // ------------------------------------------------------------------
        // 1. UPDATE PLAYER PHYSICS
        // ------------------------------------------------------------------

        updatePlayerPhysics({
            player: playerRef.current,
            platforms: platformsRef.current,
            input: inputRef.current,
            config: cfg,
            dt: physicsDt,
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
            maxFuelCapacity: currentMaxFuel,
            lastSafePlatformRef: lastSafePlatformYRef
        });

        // ------------------------------------------------------------------
        // 2. TRAIL & VISUALS
        // ------------------------------------------------------------------

        const player = playerRef.current;
        if (Math.abs(player.vy) > 10 || Math.abs(player.vx) > 10) {
            trailRef.current.push({
                x: player.x, y: player.y, life: 0.3,
                skin: state.selectedSkin, facingRight: player.facingRight, scaleY: player.squashY
            });
        }
        trailRef.current.forEach(t => t.life -= 0.05);
        trailRef.current = trailRef.current.filter(t => t.life > 0);

        if (player.y > -200 && state.gameMode !== 'TUTORIAL') {
            const lowestAltitudePlatY = platformsRef.current.reduce((max, p) => (p.id !== 999 ? Math.max(max, p.y) : max), -Infinity);
            if (lowestAltitudePlatY < -200 && player.y > -100) {
                platformsRef.current = platformsRef.current.filter(p => p.id === 999);
                lastPlatformYRef.current = 100;

                const diffMult = state.levelIndex === 2 ? (cfg.LVL2_GAP_MULT || 1.1) : 1.0;
                const hasJetpack = state.upgrades.maxFuel > 0;
                const coinMult = state.coinSpawnMultiplier || 1.0;

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
                        state.levelType, // PASS LEVEL TYPE
                        coinMult // PASS COIN SPAWN MULTIPLIER
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

        // OPTIMIZATION: Throttle platform cleanup (run every ~60 frames / 1 sec)
        // Using a simple counter based on timeElapsed would be better, but we can just check integer changes
        const currentSec = Math.floor(timeElapsedRef.current);
        const prevSec = Math.floor(timeElapsedRef.current - dt / 1000);

        if (currentSec > prevSec && (!localStorage.getItem('NEON_TEST_LEVEL') || state.gameMode !== 'TEST')) {
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
        }

        if ((!localStorage.getItem('NEON_TEST_LEVEL') || state.gameMode !== 'TEST') && state.gameMode !== 'TUTORIAL') {
            if (lastPlatformYRef.current > cameraRef.current.y - 800) {
                const lastP = platformsRef.current[platformsRef.current.length - 1];
                const diffMult = state.levelIndex === 2 ? (cfg.LVL2_GAP_MULT || 1.1) : 1.0;
                const hasJetpack = state.upgrades.maxFuel > 0;
                const coinMult = state.coinSpawnMultiplier || 1.0;

                const p = createPlatform(
                    lastPlatformYRef.current,
                    cfg,
                    state.gameMode,
                    platformGenCountRef.current + 1,
                    lastP?.x,
                    state.upgrades.luck,
                    diffMult,
                    hasJetpack,
                    state.levelType, // PASS LEVEL TYPE
                    coinMult // PASS COIN SPAWN MULTIPLIER
                );
                platformGenCountRef.current += 1;
                platformsRef.current.push(p);
                lastPlatformYRef.current = p.y;
            }
        } else if (state.gameMode === 'TUTORIAL') {
            // TUTORIAL PLATFORM GENERATION
            // Generate simple platforms upwards
            if (lastPlatformYRef.current > cameraRef.current.y - 1000) {
                const nextY = lastPlatformYRef.current - 200; // Consistent spacing
                // Alternate Left/Right
                const isLeft = (platformGenCountRef.current % 2 === 0);
                const nextX = isLeft ? 200 : 600; // Fixed positions

                platformsRef.current.push({
                    id: platformGenCountRef.current,
                    x: nextX,
                    y: nextY,
                    w: 200, h: 32,
                    type: 'STATIC' as any,
                    passed: false,
                    initialX: nextX,
                    color: '#06b6d4',
                    width: 200, height: 32
                });
                lastPlatformYRef.current = nextY;
                platformGenCountRef.current++;
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

        // Apply Pet Score Multiplier
        let finalScore = currentAltitude;
        if (petBuffs?.scoreMultiplier && petBuffs.scoreMultiplier > 1.0) {
            finalScore = Math.floor(currentAltitude * petBuffs.scoreMultiplier);
        }

        if (finalScore > scoreRef.current) scoreRef.current = finalScore;

        // Check if player passed a leaderboard record - trigger celebration
        if (leaderboardRef.current && leaderboardRef.current.length > 0 && state.isPlaying && !state.isGameOver) {
            leaderboardRef.current.forEach((entry, index) => {
                if (index >= 3) return; // Only celebrate TOP 3
                const recordKey = `${entry.id}-${entry.score}`;
                if (!passedRecordsRef.current.has(recordKey) && currentAltitude > entry.score) {
                    passedRecordsRef.current.add(recordKey);
                    recordCelebrationRef.current = {
                        active: true,
                        rank: index + 1,
                        timer: 180, // 3 seconds at 60fps
                        position: entry.score
                    };
                    // Camera shake and particles
                    // REDUCED SHAKE: User reported "invisible collision" feeling when crossing ranks.
                    // Reduced from 20 to 5 to make it subtle.
                    cameraRef.current.shake = 5;
                    soundManager.playPerfectJump();
                    // Spawn celebration particles
                    const colors = index === 0 ? ['#ffd700', '#ffed4a'] : index === 1 ? ['#c0c0c0', '#e5e5e5'] : ['#cd7f32', '#f59e0b'];
                    for (let i = 0; i < 50; i++) {
                        particlesRef.current.push({
                            x: player.x + player.width / 2 + (Math.random() - 0.5) * 300,
                            y: player.y,
                            vx: (Math.random() - 0.5) * 15,
                            vy: (Math.random() - 0.5) * 15,
                            life: 2,
                            color: colors[Math.floor(Math.random() * colors.length)],
                            size: 5 + Math.random() * 8,
                            isSpark: true
                        });
                    }
                }
            });
        }

        // Update record celebration timer
        if (recordCelebrationRef.current.active) {
            recordCelebrationRef.current.timer -= 1;
            if (recordCelebrationRef.current.timer <= 0) {
                recordCelebrationRef.current.active = false;
            }
        }

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

    // Reusable RenderContext to avoid GC pressure
    const renderContextRef = useRef<RenderContext>({
        ctx: null as any,
        width: 0,
        height: 0,
        config: configRef.current,
        state: stateRef.current,
        player: playerRef.current,
        camera: cameraRef.current,
        zoom: zoomRef.current,
        background: backgroundRef.current,
        timeElapsed: timeElapsedRef.current,
        weedMode: weedMode,
        leaderboard: leaderboard,
        localLeaderboard: localLeaderboard,
        platforms: platformsRef.current,
        selectedPlatformId: selectedPlatformId,
        particles: particlesRef.current,
        trail: trailRef.current,
        floatingTexts: floatingTextsRef.current,
        damageFlash: damageFlashRef.current,
        recordCelebration: recordCelebrationRef.current
    });

    const draw = (ctx: CanvasRenderingContext2D) => {
        // Update mutable references in context
        const rc = renderContextRef.current;
        rc.ctx = ctx;
        rc.width = ctx.canvas.width;
        rc.height = ctx.canvas.height;
        rc.config = configRef.current;
        rc.state = stateRef.current;
        rc.player = playerRef.current;
        rc.camera = cameraRef.current;
        rc.zoom = zoomRef.current;
        rc.background = backgroundRef.current;
        rc.timeElapsed = timeElapsedRef.current;
        rc.weedMode = weedMode;
        rc.leaderboard = leaderboardRef.current; // Use Ref for latest
        rc.localLeaderboard = localLeaderboardRef?.current; // Use Ref for latest
        rc.platforms = platformsRef.current;
        rc.selectedPlatformId = selectedPlatformId;
        rc.particles = particlesRef.current;
        rc.trail = trailRef.current;
        rc.floatingTexts = floatingTextsRef.current;
        rc.damageFlash = damageFlashRef.current;
        rc.recordCelebration = recordCelebrationRef.current;

        renderGame(rc);
    };

    useEffect(() => {
        let rAF: number;
        const FIXED_TIMESTEP = 1000 / 60; // 16.66ms (60 FPS physics)
        const MAX_FRAME_TIME = 250; // Cap frame time to avoid spiral of death

        const loop = (time: number) => {
            if (lastTimeRef.current === 0) {
                lastTimeRef.current = time;
                rAF = requestAnimationFrame(loop);
                return;
            }

            let dt = time - lastTimeRef.current;
            lastTimeRef.current = time;

            // FPS Calculation
            frameCountRef.current++;
            if (time - lastFpsUpdateRef.current >= 1000) {
                fpsRef.current = frameCountRef.current;
                frameCountRef.current = 0;
                lastFpsUpdateRef.current = time;
            }

            // Cap dt to prevent spiral of death
            if (dt > MAX_FRAME_TIME) dt = MAX_FRAME_TIME;

            accumulatorRef.current += dt;

            // Fixed Timestep Loop
            while (accumulatorRef.current >= FIXED_TIMESTEP) {
                update(FIXED_TIMESTEP);
                accumulatorRef.current -= FIXED_TIMESTEP;
            }

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

                    // DEBUG OVERLAY
                    if (showDebug) {
                        ctx.save();
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                        ctx.fillRect(10, 10, 220, 130);
                        ctx.fillStyle = '#00ff00';
                        ctx.font = '12px monospace';
                        ctx.fillText(`FPS: ${fpsRef.current}`, 20, 30);
                        ctx.fillText(`DT: ${dt.toFixed(2)}ms`, 20, 45);
                        ctx.fillText(`Phys Steps: ${Math.floor((accumulatorRef.current + dt) / FIXED_TIMESTEP)}`, 20, 60);
                        ctx.fillText(`Player Y: ${Math.floor(playerRef.current.y)}`, 20, 75);
                        ctx.fillText(`Entities: ${platformsRef.current.length}`, 20, 90);
                        ctx.fillText(`Particles: ${particlesRef.current.length}`, 20, 105);
                        ctx.fillText(`Resolution: ${canvas.width}x${canvas.height}`, 20, 120);
                        ctx.restore();
                    }
                }
            }
            rAF = requestAnimationFrame(loop);
        };
        rAF = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rAF);
    }, []); // SENIOR DEV FIX: Empty dependency array. The loop MUST NOT restart on state changes. Use Refs for everything.
};
