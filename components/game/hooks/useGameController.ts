
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GameState, Player, Platform, PlatformType, Particle, GameConfig, CharacterSkin, LeaderboardEntry, ShopUpgrades, SaveNode } from '../../../types';
import * as Constants from '../../../constants';
import { getWorldWidthAtHeight, getWorldPos } from '../utils';
import { createPlatform } from '../platforms';
import { initBackground, SceneryObject } from '../background';
import { soundManager } from '../audioManager';
import { Persistence } from '../persistence';
import { pollMenuNavigation } from '../inputHandlers';
import { SKINS } from '../assets'; // IMPORT SKINS

interface GameControllerProps {
    configRef: React.MutableRefObject<GameConfig>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    playerRef: React.MutableRefObject<Player & { squashX: number, squashY: number, eyeBlinkTimer: number, facingRight: boolean }>;
    platformsRef: React.MutableRefObject<Platform[]>;
    backgroundRef: React.MutableRefObject<SceneryObject[]>;
    cameraRef: React.MutableRefObject<any>;
    zoomRef: React.MutableRefObject<number>;
    fallStartRef: React.MutableRefObject<number | null>;
    particlesRef: React.MutableRefObject<Particle[]>;
    trailRef: React.MutableRefObject<any[]>;
    timeElapsedRef: React.MutableRefObject<number>;
    lastPlatformYRef: React.MutableRefObject<number>;
    platformGenCountRef: React.MutableRefObject<number>;
    saveNodesRef: React.MutableRefObject<SaveNode[]>;
    damageFlashRef: React.MutableRefObject<number>;
    jetpackModeRef: React.MutableRefObject<'IDLE' | 'BURST' | 'GLIDE'>;
    inputRef: React.MutableRefObject<any>;
    availableSkinsRef: React.MutableRefObject<CharacterSkin[]>;
    isControlsOpenRef: React.MutableRefObject<boolean>;
    showCalibration: boolean;
    setShowCalibration: (v: boolean) => void;
    setIsControlsOpen: (v: boolean) => void;
}

export const useGameController = (props: GameControllerProps) => {
    const {
        configRef, playerRef, platformsRef, backgroundRef, cameraRef, zoomRef, fallStartRef,
        particlesRef, trailRef, timeElapsedRef, lastPlatformYRef, platformGenCountRef,
        saveNodesRef, damageFlashRef, jetpackModeRef, inputRef, availableSkinsRef,
        isControlsOpenRef, showCalibration, setShowCalibration, setIsControlsOpen
    } = props;

    const [gameState, setGameState] = useState<GameState>({
        username: "Player 1",
        runId: `run-${Date.now()}`,
        gameMode: 'NORMAL',
        levelIndex: 1,
        levelType: 'CAMPAIGN',
        mobileControlMode: 'BUTTONS',
        score: 0,
        highScore: 0,
        maxAltitude: 0,
        totalCoins: 0,
        runCoins: 0,
        fuel: 0,
        health: Constants.MAX_HEALTH,
        maxHealth: Constants.MAX_HEALTH,
        isGameOver: false,
        isPaused: false,
        isPlaying: false,
        isEditing: false,
        isFreefallMode: false,
        isShopOpen: false,
        waitingForFirstJump: false,
        combo: 0,
        selectedSkin: SKINS[0], // FIX: Initialize with valid skin, not empty placeholder
        upgrades: { maxFuel: 0, efficiency: 0, luck: 0, jump: 0, shield: 0, aerodynamics: 0 },
        hitStop: 0
    });

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const leaderboardRef = useRef<LeaderboardEntry[]>([]);
    const highScoreEntryStatusRef = useRef<'NONE' | 'PENDING' | 'SUBMITTED'>('NONE');
    const [showGameOverMenu, setShowGameOverMenu] = useState(false);
    const [menuIndex, setMenuIndex] = useState(0);
    const menuIndexRef = useRef(0);
    const stateRef = useRef(gameState);

    // Sync Refs
    useEffect(() => { stateRef.current = gameState; }, [gameState]);
    useEffect(() => { menuIndexRef.current = menuIndex; }, [menuIndex]);
    useEffect(() => { leaderboardRef.current = leaderboard; }, [leaderboard]);

    // --- INIT GAME WORLD ---
    const initGameWorld = (levelIndex: number = 1, levelType: 'CAMPAIGN' | 'RANDOM' = 'CAMPAIGN') => {
        const cfg = configRef.current;
        const initWidth = getWorldWidthAtHeight(0, cfg);
        const pSize = cfg.PLAYER_SIZE || 80;

        playerRef.current = {
            x: initWidth / 2 - pSize / 2, y: 0, width: pSize, height: pSize, vx: 0, vy: 0, isGrounded: false,
            jumpCooldown: 0, squashX: 1, squashY: 1, eyeBlinkTimer: 0, facingRight: true
        };
        platformsRef.current = [];
        saveNodesRef.current = [];
        platformGenCountRef.current = 0;

        const savedLevel = Persistence.loadTestLevel();
        if (stateRef.current.gameMode === 'TEST' && savedLevel) {
            platformsRef.current = savedLevel;
            if (!platformsRef.current.find(p => p.id === 999)) {
                platformsRef.current.push({ id: 999, x: -initWidth, y: 100, initialX: -initWidth, width: initWidth * 3, height: 50, type: PlatformType.STATIC, color: '#4ade80' });
            }
            platformsRef.current.forEach(p => { p.broken = false; p.respawnTimer = 0; });
            lastPlatformYRef.current = platformsRef.current.reduce((min, p) => p.y < min ? p.y : min, 0);
        } else {
            // Ground
            platformsRef.current.push({
                id: 999, x: -initWidth, y: 100, initialX: -initWidth, width: initWidth * 3, height: 50, type: PlatformType.STICKY, color: '#84cc16'
            });
            lastPlatformYRef.current = 100;

            const diffMult = levelIndex === 2 ? Constants.LVL2_GAP_MULT : 1.0;
            for (let i = 0; i < 6; i++) {
                const p = createPlatform(
                    lastPlatformYRef.current, cfg, stateRef.current.gameMode,
                    platformGenCountRef.current + 1, undefined, 0, diffMult, false, levelType
                );
                platformGenCountRef.current += 1;
                platformsRef.current.push(p);
                lastPlatformYRef.current = p.y;
            }
        }

        backgroundRef.current = initBackground(initWidth);
        cameraRef.current = { y: 0, targetY: 0, shake: 0 };
        zoomRef.current = 1.0;
        fallStartRef.current = null;
        particlesRef.current = [];
        trailRef.current = [];
        timeElapsedRef.current = 0;
        damageFlashRef.current = 0;
        jetpackModeRef.current = 'IDLE';
    };

    // --- GAME ACTIONS ---
    const handleStart = async (mode: 'NORMAL' | 'TEST' = 'NORMAL') => {
        soundManager.init();
        soundManager.playClick();
        soundManager.startMusic();
        window.focus();

        const cfg = configRef.current;
        stateRef.current.gameMode = mode;
        setShowGameOverMenu(false);
        setMenuIndex(0);

        // Init Logic
        const currentState = stateRef.current;
        initGameWorld(currentState.levelIndex, currentState.levelType);

        const newRunId = `run-${Date.now()}-${Math.random()}`;
        const newState: GameState = {
            ...currentState,
            runId: newRunId,
            isPlaying: true,
            isGameOver: false,
            isPaused: false,
            isEditing: false,
            isFreefallMode: false,
            isShopOpen: false,
            waitingForFirstJump: true,
            gameMode: mode,
            score: 0,
            runCoins: 0,
            fuel: 0,
            health: cfg.MAX_HEALTH,
            maxHealth: cfg.MAX_HEALTH,
            combo: 0,
            hitStop: 0
        };
        setGameState(newState);
        stateRef.current = newState;
    };

    const handleGameOver = useCallback((finalScore: number) => {
        const currentGameState = stateRef.current;
        const currentHighScore = Math.max(finalScore, currentGameState.highScore);
        const currentMaxAlt = Math.max(finalScore, currentGameState.maxAltitude);

        Persistence.saveHighScore(currentHighScore);
        Persistence.saveMaxAltitude(currentMaxAlt);

        const newTotalCoins = currentGameState.totalCoins + currentGameState.runCoins;
        Persistence.saveCoins(newTotalCoins);

        const currentBoard = leaderboardRef.current;
        const qualifies = currentBoard.length < 3 || finalScore > currentBoard[currentBoard.length - 1].score;
        highScoreEntryStatusRef.current = qualifies ? 'PENDING' : 'NONE';

        setGameState(prev => ({
            ...prev,
            isGameOver: true,
            health: 0,
            score: finalScore,
            highScore: currentHighScore,
            maxAltitude: currentMaxAlt,
            totalCoins: newTotalCoins
        }));

        setTimeout(() => {
            setShowGameOverMenu(true);
            setMenuIndex(0);
        }, 1000);
    }, []);

    const buyUpgrade = (id: keyof ShopUpgrades) => {
        const state = stateRef.current;
        const upgradeDefs: any = {
            maxFuel: { type: 'upgrade' }, efficiency: { type: 'upgrade' }, jump: { type: 'upgrade' },
            aerodynamics: { type: 'upgrade' }, luck: { type: 'upgrade' },
            shield: { type: 'consumable', cost: Constants.ITEM_SHIELD_COST, max: 3 }
        };

        const def = upgradeDefs[id];
        if (!def) return;

        const currentLevel = state.upgrades[id];
        const limit = def.max || 5;
        let cost = def.type === 'consumable' ? def.cost : Math.floor(Constants.UPGRADE_COST_BASE * Math.pow(Constants.UPGRADE_COST_SCALE, currentLevel));

        if (state.totalCoins >= cost && currentLevel < limit) {
            soundManager.playCollect();
            setGameState(prev => ({
                ...prev,
                totalCoins: prev.totalCoins - cost,
                upgrades: { ...prev.upgrades, [id]: prev.upgrades[id] + 1 }
            }));
        } else {
            soundManager.playDamage();
        }
    };

    const handleMenuAction = useCallback(() => {
        const state = stateRef.current;
        const index = menuIndexRef.current;
        soundManager.playClick();

        if (!state.isPlaying && !state.isGameOver && !state.isShopOpen && !isControlsOpenRef.current && !showCalibration) {
            if (index === 0) handleStart('NORMAL');
            if (index === 1) handleStart('NORMAL');
            if (index === 2) setGameState(p => ({ ...p, isShopOpen: true }));
            if (index === 3) setIsControlsOpen(true);
            if (index === 4) { soundManager.playCollect(); handleStart('NORMAL'); } // Quick Launch
            return;
        }
        if (state.isPaused && !state.isGameOver) {
            if (index === 0) setGameState(p => ({ ...p, isPaused: false }));
            if (index === 1) { setGameState(p => ({ ...p, isPaused: false })); handleStart('NORMAL'); }
            if (index === 2) setGameState(p => ({ ...p, isPaused: false, isPlaying: false, isGameOver: false }));
            return;
        }
        if (state.isGameOver && showGameOverMenu) {
            if (index === 0) handleStart('NORMAL');
            if (index === 1) setGameState(p => ({ ...p, isGameOver: false, isPlaying: false, isShopOpen: true }));
            if (index === 2) setGameState(p => ({ ...p, isGameOver: false, isPlaying: false }));
            return;
        }
        if (isControlsOpenRef.current) { setIsControlsOpen(false); return; }
        if (state.isShopOpen) {
            const upgrades = ['maxFuel', 'efficiency', 'jump', 'aerodynamics', 'luck', 'shield'];
            buyUpgrade(upgrades[index] as keyof ShopUpgrades);
        }
    }, [showGameOverMenu, showCalibration]);

    const updateMenuNavigation = useCallback(() => {
        const nav = pollMenuNavigation(inputRef);
        const state = stateRef.current;
        const index = menuIndexRef.current;
        const skins = availableSkinsRef.current;

        if (nav.back) {
            if (state.isShopOpen) { setGameState(p => ({ ...p, isShopOpen: false })); return; }
            if (isControlsOpenRef.current) { setIsControlsOpen(false); return; }
            if (showCalibration) { setShowCalibration(false); return; }
            if (state.isPaused) { setGameState(p => ({ ...p, isPaused: false })); return; }
        }
        if (nav.select) { handleMenuAction(); return; }

        if (!nav.up && !nav.down && !nav.left && !nav.right) return;
        soundManager.playHover();

        // --- START SCREEN NAV ---
        if (!state.isPlaying && !state.isGameOver && !state.isShopOpen && !isControlsOpenRef.current && !showCalibration) {
            if (index === 0) { // Level Select
                if (nav.down) setMenuIndex(1);
                if (nav.left) {
                    if (state.levelType === 'RANDOM') setGameState(p => ({ ...p, levelIndex: 1, levelType: 'CAMPAIGN' }));
                    else if (state.levelIndex === 2) setGameState(p => ({ ...p, levelType: 'RANDOM' }));
                }
                if (nav.right) {
                    const isLvl2Unlocked = state.maxAltitude >= Constants.UNLOCK_ALTITUDE_LVL2;
                    if (state.levelType === 'CAMPAIGN' && state.levelIndex === 1) setGameState(p => ({ ...p, levelType: 'RANDOM' }));
                    else if (state.levelType === 'RANDOM' && isLvl2Unlocked) setGameState(p => ({ ...p, levelIndex: 2, levelType: 'CAMPAIGN' }));
                }
            } else if (index === 1) { // Launch
                if (nav.up) setMenuIndex(0);
                if (nav.down) setMenuIndex(2);
            } else if (index === 2) { // Shop
                if (nav.up) setMenuIndex(1);
                if (nav.right) setMenuIndex(3);
                if (nav.down) setMenuIndex(4);
            } else if (index === 3) { // Controls
                if (nav.up) setMenuIndex(1);
                if (nav.left) setMenuIndex(2);
                if (nav.down) setMenuIndex(4);
            } else if (index === 4) { // Skin
                if (nav.up) setMenuIndex(2);
                const currentIdx = skins.findIndex(s => s.id === state.selectedSkin.id);
                if (nav.left) {
                    const next = skins[(currentIdx - 1 + skins.length) % skins.length];
                    setGameState(p => ({ ...p, selectedSkin: next }));
                }
                if (nav.right) {
                    const next = skins[(currentIdx + 1) % skins.length];
                    setGameState(p => ({ ...p, selectedSkin: next }));
                }
            }
        }
        // --- PAUSE NAV ---
        else if (state.isPaused) {
            if (nav.up) setMenuIndex(prev => Math.max(0, prev - 1));
            else if (nav.down) setMenuIndex(prev => Math.min(2, prev + 1));
        }
        // --- GAME OVER NAV ---
        else if (state.isGameOver && showGameOverMenu) {
            if (nav.up) setMenuIndex(prev => Math.max(0, prev - 1));
            else if (nav.down) setMenuIndex(prev => Math.min(2, prev + 1));
            if (nav.left) setMenuIndex(prev => Math.max(0, prev - 1));
            else if (nav.right) setMenuIndex(prev => Math.min(2, prev + 1));
        }
        // --- SHOP NAV ---
        else if (state.isShopOpen) {
            if (nav.right) setMenuIndex(prev => Math.min(5, prev + 1));
            else if (nav.left) setMenuIndex(prev => Math.max(0, prev - 1));
            else if (nav.down) setMenuIndex(prev => Math.min(5, prev + 3));
            else if (nav.up) setMenuIndex(prev => Math.max(0, prev - 3));
        }
    }, [handleMenuAction, showGameOverMenu, showCalibration]);

    // Fetch Global Leaderboard on Mount
    useEffect(() => {
        Persistence.fetchGlobalLeaderboard().then(globalScores => {
            if (globalScores && globalScores.length > 0) {
                setLeaderboard(globalScores);
                leaderboardRef.current = globalScores;
            } else {
                // Fallback to local
                const local = Persistence.loadLeaderboard();
                setLeaderboard(local);
                leaderboardRef.current = local;
            }
        });
    }, []);

    const handleSaveLeaderboardScore = (name: string) => {
        if (highScoreEntryStatusRef.current === 'SUBMITTED') return;
        const runId = gameState.runId;
        const currentScore = gameState.score;

        // Submit Global
        Persistence.submitGlobalScore(name, currentScore);

        // Optimistic Update (Local)
        const newEntry: LeaderboardEntry = { id: runId, name, score: currentScore, date: new Date().toISOString() };
        const newBoard = [...leaderboardRef.current, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Keep top 10

        setLeaderboard(newBoard);
        leaderboardRef.current = newBoard;
        highScoreEntryStatusRef.current = 'SUBMITTED';
    };

    return {
        gameState, setGameState, stateRef,
        leaderboard, setLeaderboard, leaderboardRef, highScoreEntryStatusRef,
        showGameOverMenu, setShowGameOverMenu,
        menuIndex, setMenuIndex,
        handleStart, handleGameOver, handleMenuAction, updateMenuNavigation,
        buyUpgrade, handleSaveLeaderboardScore, initGameWorld
    };
};
