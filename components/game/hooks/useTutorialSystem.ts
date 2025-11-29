import { useRef, useEffect } from 'react';
import { GameState, Player, Platform } from '../../../types';

interface TutorialSystemProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    playerRef: React.MutableRefObject<Player>;
    platformsRef: React.MutableRefObject<Platform[]>;
    lastPlatformYRef: React.MutableRefObject<number>;
    fuelRef: React.MutableRefObject<number>;
    jetpackAllowedRef: React.MutableRefObject<boolean>;
}

export const useTutorialSystem = (props: TutorialSystemProps) => {
    const {
        gameState,
        setGameState,
        playerRef,
        platformsRef,
        lastPlatformYRef,
        fuelRef,
        jetpackAllowedRef
    } = props;

    const lastInitializedStepRef = useRef<number>(-1);

    // Initialize tutorial platforms when step changes
    useEffect(() => {
        if (gameState.gameMode !== 'TUTORIAL') return;

        const step = gameState.tutorialStep || 0;

        // Only initialize when step changes
        if (lastInitializedStepRef.current === step) return;
        lastInitializedStepRef.current = step;

        // PHASE-SPECIFIC PLATFORM LAYOUTS
        if (step === 0) {
            // PHASE 1: MOVIMENTO
            platformsRef.current = [
                { id: 1, x: -300, y: 100, w: 600, h: 64, type: 'STATIC' as any, passed: false, initialX: -300, color: '#06b6d4', width: 600, height: 64 }
            ];
        } else if (step === 1) {
            // PHASE 2: PULO BÁSICO
            platformsRef.current = [
                { id: 1, x: -200, y: 100, w: 150, h: 64, type: 'STATIC' as any, passed: false, initialX: -200, color: '#06b6d4', width: 150, height: 64 },
                { id: 2, x: 30, y: 100, w: 200, h: 64, type: 'STATIC' as any, passed: false, initialX: 30, color: '#22c55e', width: 200, height: 64 }
            ];
        } else if (step === 2) {
            // PHASE 3: PERFECT JUMP
            platformsRef.current = [
                { id: 1, x: -200, y: 100, w: 150, h: 64, type: 'STATIC' as any, passed: false, initialX: -200, color: '#06b6d4', width: 150, height: 64 },
                { id: 2, x: 100, y: 100, w: 200, h: 64, type: 'STATIC' as any, passed: false, initialX: 100, color: '#ec4899', width: 200, height: 64 }
            ];
        } else if (step === 3) {
            // PHASE 4: JETPACK (Force Enable)
            platformsRef.current = [
                { id: 1, x: -150, y: 100, w: 150, h: 64, type: 'STATIC' as any, passed: false, initialX: -150, color: '#06b6d4', width: 150, height: 64 },
                { id: 2, x: -50, y: -200, w: 200, h: 64, type: 'STATIC' as any, passed: false, initialX: -50, color: '#f97316', width: 200, height: 64 }
            ];
            fuelRef.current = 999; // Infinite fuel
            jetpackAllowedRef.current = true; // Force allow
        } else if (step === 4) {
            // PHASE 5: DESAFIO FINAL
            platformsRef.current = [];
            lastPlatformYRef.current = 0;
        }
    }, [gameState.tutorialStep, gameState.gameMode]);

    // Force player position during INSTRUCTION phase (prevents drift)
    const forcePlayerPosition = () => {
        if (gameState.gameMode !== 'TUTORIAL' || gameState.tutorialPhase !== 'INSTRUCTION') return;

        const step = gameState.tutorialStep || 0;
        playerRef.current.vx = 0;
        playerRef.current.vy = 0;

        if (step === 0) {
            playerRef.current.x = 0;
            playerRef.current.y = -50;
        } else if (step === 1) {
            playerRef.current.x = -100;
            playerRef.current.y = 36;
        } else if (step === 2) {
            playerRef.current.x = -100;
            playerRef.current.y = 36;
        } else if (step === 3) {
            playerRef.current.x = -50;
            playerRef.current.y = 36;
        } else if (step === 4) {
            playerRef.current.x = 0;
            playerRef.current.y = -100;
        }
    };

    // Check tutorial completion conditions
    const checkCompletion = () => {
        if (gameState.gameMode !== 'TUTORIAL' || gameState.tutorialPhase !== 'PLAYING') return;

        const step = gameState.tutorialStep || 0;
        const p = playerRef.current;

        if (step === 0) {
            // FASE 1: MOVIMENTO - Moveu 150px em qualquer direção
            if (Math.abs(p.x) > 150) {
                setGameState(prev => ({ ...prev, tutorialPhase: 'COMPLETED' }));
            }
        } else if (step === 1) {
            // FASE 2: PULO - Aterrissou na segunda plataforma
            if (p.x > 50 && p.isGrounded) {
                setGameState(prev => ({ ...prev, tutorialPhase: 'COMPLETED' }));
            }
            // Reset se cair
            if (p.y > 300) {
                setGameState(prev => ({ ...prev, tutorialPhase: 'INSTRUCTION' }));
            }
        } else if (step === 2) {
            // FASE 3: PERFECT JUMP - Atravessou o gap grande
            if (p.x > 120 && p.isGrounded) {
                setGameState(prev => ({ ...prev, tutorialPhase: 'COMPLETED' }));
            }
            // Reset se cair
            if (p.y > 300) {
                setGameState(prev => ({ ...prev, tutorialPhase: 'INSTRUCTION' }));
            }
        } else if (step === 3) {
            // FASE 4: JETPACK - Chegou na plataforma alta
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
    };

    // Should pause physics?
    const shouldPausePhysics = () => {
        return gameState.gameMode === 'TUTORIAL' && gameState.tutorialPhase !== 'PLAYING';
    };

    // Get slow motion multiplier for step 2 (Perfect Jump)
    const getPhysicsMultiplier = () => {
        if (gameState.gameMode === 'TUTORIAL' && gameState.tutorialStep === 2) {
            const p = playerRef.current;
            // Slow down when falling and close to ground (simulating the "Zone")
            if (p.y > -50 && p.vy > 0) {
                return 0.2; // 20% speed
            }
        }
        return 1.0; // Normal speed
    };

    return {
        forcePlayerPosition,
        checkCompletion,
        shouldPausePhysics,
        getPhysicsMultiplier
    };
};
