
import React, { useCallback, useEffect, useRef } from 'react';
import { GameState, Player, Platform, PlatformType, GameConfig } from '../../../types';
import { getWorldPos } from '../utils';
import { soundManager } from '../audioManager';

interface InputControllerProps {
    inputRef: React.MutableRefObject<any>;
    stateRef: React.MutableRefObject<GameState>;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    configRef: React.MutableRefObject<GameConfig>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    playerRef: React.MutableRefObject<Player>;
    platformsRef: React.MutableRefObject<Platform[]>;
    cameraRef: React.MutableRefObject<any>;
    zoomRef: React.MutableRefObject<number>;
    mouseRef: React.MutableRefObject<any>;
    editorTool: string;
    setEditorTool: (v: any) => void;
    selectedPlatformId: number | null;
    setSelectedPlatformId: (v: number | null) => void;
    handleStart: (mode: any) => void;
    showGameOverMenu: boolean;
    showCalibration: boolean;
    setShowCalibration: (v: boolean) => void;
    gyroEnabled: boolean;
    setRawTiltDebug: (v: number) => void;
    setTiltDebug: (v: number) => void;
    calibrationRef: React.MutableRefObject<any>;
}

export const useInputController = (props: InputControllerProps) => {
    const {
        inputRef, stateRef, setGameState, configRef, canvasRef, playerRef, platformsRef,
        cameraRef, zoomRef, mouseRef, editorTool, setEditorTool, selectedPlatformId,
        setSelectedPlatformId, handleStart, showGameOverMenu, showCalibration, setShowCalibration,
        gyroEnabled, setRawTiltDebug, setTiltDebug, calibrationRef
    } = props;

    const handleFirstInteraction = () => {
        soundManager.init();
        soundManager.playClick();
    };

    // --- MOTION CONTROL DELETED PER USER REQUEST ---
    // Force BUTTONS mode if TILT was previously selected
    useEffect(() => {
        if (stateRef.current.mobileControlMode === 'TILT') {
            setGameState(prev => ({ ...prev, mobileControlMode: 'BUTTONS' }));
        }
    }, []);

    // 2. Motion / Tilt Controls
    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (!gyroEnabled || stateRef.current.mobileControlMode !== 'TILT') return;

            const beta = event.beta || 0; // X-axis tilt (-180 to 180)
            const gamma = event.gamma || 0; // Y-axis tilt (-90 to 90)

            // Calculate tilt based on orientation (landscape vs portrait)
            // Assuming landscape for main gameplay, but checking window orientation if possible
            let tilt = gamma; // Default to gamma for portrait/landscape switch usually handled by OS lock

            // Apply calibration offset
            tilt -= calibrationRef.current.offset;

            // Apply sensitivity and multiplier
            // Base sensitivity * Mobile Multiplier
            const sensitivity = configRef.current.GYRO_SENSITIVITY * (configRef.current.MOBILE_SENSITIVITY_MULTIPLIER || 1);

            // Normalize tilt to -1 to 1 range based on sensitivity
            // A tilt of 30 degrees with high sensitivity should reach max input
            const maxTiltAngle = 45; // Degrees to reach full speed at 1x sensitivity
            const effectiveMaxTilt = maxTiltAngle / (sensitivity / 20); // Higher sensitivity = lower angle needed

            let normalizedTilt = tilt / effectiveMaxTilt;

            // Clamp to -1 to 1
            normalizedTilt = Math.max(-1, Math.min(1, normalizedTilt));

            // Apply deadzone
            if (Math.abs(normalizedTilt) < configRef.current.GAMEPAD_DEADZONE) {
                normalizedTilt = 0;
            }

            // Invert if needed
            if (calibrationRef.current.inverted) normalizedTilt *= -1;

            // Update input ref
            inputRef.current.tiltX = normalizedTilt;
            inputRef.current.targetTiltX = normalizedTilt;

            // Debug
            setRawTiltDebug(Math.round(tilt));
            setTiltDebug(Math.round(normalizedTilt * 100));

            // Map to left/right booleans for digital movement fallback
            if (normalizedTilt < -0.2) {
                inputRef.current.left = true;
                inputRef.current.right = false;
            } else if (normalizedTilt > 0.2) {
                inputRef.current.left = false;
                inputRef.current.right = true;
            } else {
                inputRef.current.left = false;
                inputRef.current.right = false;
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [gyroEnabled, stateRef.current.mobileControlMode]);

    // 3. Game Loop for Input Smoothing (Optional but good for analog feel)
    useEffect(() => {
        let rAF: number;
        const loop = () => {
            // Smooth interpolation for tilt could go here if raw input is jittery
            rAF = requestAnimationFrame(loop);
        };
        rAF = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rAF);
    }, []);

    // --- MOUSE / TOUCH ---
    const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        handleFirstInteraction();
        const isTouch = 'touches' in e;
        const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (stateRef.current.isEditing) {
            const { width, height } = canvasRef.current!;
            const wPos = getWorldPos(x, y, width, height, playerRef.current.y, cameraRef.current.y, zoomRef.current, configRef.current, false);

            // Check if Ctrl key is pressed (for quick platform creation)
            const isCtrlPressed = (e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).metaKey;

            if (isCtrlPressed || editorTool === 'ADD') {
                const newP: Platform = {
                    id: Date.now(), x: wPos.x - 60, y: wPos.y, initialX: wPos.x - 60, width: 120, height: 34,
                    type: PlatformType.STATIC, color: '#ef4444', broken: false, respawnTimer: 0
                };
                platformsRef.current.push(newP);
                setSelectedPlatformId(newP.id);
            } else {
                const hit = platformsRef.current.find(p => wPos.x >= p.x && wPos.x <= p.x + p.width && wPos.y >= p.y && wPos.y <= p.y + p.height);
                if (hit) {
                    if (editorTool === 'DELETE') {
                        platformsRef.current = platformsRef.current.filter(p => p.id !== hit.id);
                        setSelectedPlatformId(null);
                    } else {
                        setSelectedPlatformId(hit.id);
                        mouseRef.current = { isDown: true, x: wPos.x, y: wPos.y, dragOffsetX: wPos.x - hit.x, dragOffsetY: wPos.y - hit.y };
                    }
                } else { setSelectedPlatformId(null); }
            }
        } else {
            e.preventDefault();
            if (!stateRef.current.isFreefallMode && !inputRef.current.jetpack && stateRef.current.fuel > 0 && !stateRef.current.isPaused && stateRef.current.isPlaying) {
                setGameState(prev => ({ ...prev, fuel: Math.max(0, prev.fuel - configRef.current.JETPACK_IGNITION_COST) }));
            }
            inputRef.current.jetpack = true;
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!stateRef.current.isEditing || !mouseRef.current.isDown || !selectedPlatformId) return;
        const isTouch = 'touches' in e;
        const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const { width, height } = canvasRef.current!;
        const wPos = getWorldPos(clientX - rect.left, clientY - rect.top, width, height, playerRef.current.y, cameraRef.current.y, zoomRef.current, configRef.current, false);
        const pIndex = platformsRef.current.findIndex(p => p.id === selectedPlatformId);
        if (pIndex > -1) {
            const p = platformsRef.current[pIndex];
            p.x = wPos.x - mouseRef.current.dragOffsetX;
            p.y = wPos.y - mouseRef.current.dragOffsetY;
            p.initialX = p.x;
        }
    };

    const handleCanvasMouseUp = () => {
        mouseRef.current.isDown = false;
        if (!stateRef.current.isEditing) inputRef.current.jetpack = false;
    };

    // --- KEYBOARD ---
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.repeat) return;
        if (e.target instanceof HTMLInputElement) return;
        const state = stateRef.current;
        if (state.isEditing) {
            if (e.code === 'KeyM') setEditorTool('MOVE');
            if (e.code === 'KeyA') setEditorTool('ADD');
            if (e.code === 'KeyS') { if (platformsRef.current.length > 0) { localStorage.setItem('NEON_TEST_LEVEL', JSON.stringify(platformsRef.current)); alert('Level saved!'); } }
            if (e.code === 'Delete' || e.code === 'KeyX') setEditorTool('DELETE');
        }
        if (e.code === 'Enter') {
            handleFirstInteraction();
            if (state.isGameOver && showGameOverMenu) { handleStart(state.gameMode); return; }
            if (!state.isPlaying && !showCalibration) { handleStart('NORMAL'); return; }
            if (!showCalibration) setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
            soundManager.playClick();
            inputRef.current.menuSelect = true;
        }
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            handleFirstInteraction();
            inputRef.current.jumpIntent = true;
            inputRef.current.jumpPressedTime = Date.now();
            inputRef.current.up = true;
            if (!state.isPlaying) soundManager.playHover();
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyZ') {
            e.preventDefault();
            handleFirstInteraction();
            if (!state.isFreefallMode && !inputRef.current.jetpack && state.fuel > 0) {
                setGameState(prev => ({ ...prev, fuel: Math.max(0, prev.fuel - configRef.current.JETPACK_IGNITION_COST) }));
            }
            inputRef.current.jetpack = true;
        }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputRef.current.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') inputRef.current.right = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') inputRef.current.down = true;
        if (e.code === 'Escape') {
            if (showCalibration) { setShowCalibration(false); return; }
            setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
            soundManager.playClick();
            inputRef.current.menuBack = true;
        }
    }, [showGameOverMenu, showCalibration]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { inputRef.current.jumpIntent = false; inputRef.current.up = false; }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyZ') { inputRef.current.jetpack = false; }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputRef.current.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') inputRef.current.right = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') inputRef.current.down = false;
        if (e.code === 'Enter') inputRef.current.menuSelect = false;
        if (e.code === 'Escape') inputRef.current.menuBack = false;
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    return { handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp, handleFirstInteraction };
};
