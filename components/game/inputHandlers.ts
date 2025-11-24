
import React from 'react';
import { GameState } from '../../types';
import * as Constants from '../../constants';
import { soundManager } from './audioManager';

// Helper to get current gamepad state
const getGamepad = () => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    return gamepads[0];
};

export const pollMenuNavigation = (inputRef: React.MutableRefObject<any>) => {
    const pad = getGamepad();
    const now = Date.now();
    
    // 1. Read Keyboard State from Ref
    // Note: We use 'up' for menu navigation, distinct from jumpIntent if possible, 
    // but typically Arrow Up maps to both.
    const keyUp = inputRef.current.up; 
    const keyDown = inputRef.current.down;
    const keyLeft = inputRef.current.left;
    const keyRight = inputRef.current.right;
    const keySelect = inputRef.current.menuSelect;
    const keyBack = inputRef.current.menuBack;

    // 2. Read Gamepad State
    let padUp = false;
    let padDown = false;
    let padLeft = false;
    let padRight = false;
    let padSelect = false;
    let padBack = false;

    if (pad) {
        const axisX = pad.axes[0];
        const axisY = pad.axes[1];
        const threshold = 0.5;

        // D-Pad (Buttons 12-15) and Left Stick (Axes 0-1)
        if (pad.buttons[12]?.pressed || axisY < -threshold) padUp = true;
        if (pad.buttons[13]?.pressed || axisY > threshold) padDown = true;
        if (pad.buttons[14]?.pressed || axisX < -threshold) padLeft = true;
        if (pad.buttons[15]?.pressed || axisX > threshold) padRight = true;

        if (pad.buttons[0]?.pressed) padSelect = true; // A / Cross
        if (pad.buttons[1]?.pressed) padBack = true; // B / Circle
    }

    // 3. Combine Inputs
    const up = keyUp || padUp;
    const down = keyDown || padDown;
    const left = keyLeft || padLeft;
    const right = keyRight || padRight;
    const select = keySelect || padSelect;
    const back = keyBack || padBack;

    // 4. Bitmask Logic for Input Changes
    let currentInputMask = 0;
    if (up) currentInputMask |= 1;
    if (down) currentInputMask |= 2;
    if (left) currentInputMask |= 4;
    if (right) currentInputMask |= 8;
    if (select) currentInputMask |= 16;
    if (back) currentInputMask |= 32;

    // Default Result
    const result = { up: false, down: false, left: false, right: false, select: false, back: false };

    // If no input, reset tracking and exit
    if (currentInputMask === 0) {
        inputRef.current.menuInputCooldown = 0;
        inputRef.current.lastInputMask = 0;
        return result;
    }

    // 5. Smart Cooldown Check
    const lastInputTime = inputRef.current.menuInputCooldown || 0;
    const lastInputMask = inputRef.current.lastInputMask || 0;
    const COOLDOWN_MS = 180;

    // Logic:
    // 1. If it's a DIFFERENT button combo than last frame, ACT IMMEDIATELY (Bypass Cooldown)
    // 2. If it's the SAME button held down, check COOLDOWN (Throttle)
    
    const isNewInput = currentInputMask !== lastInputMask;
    const isCooldownActive = (now - lastInputTime < COOLDOWN_MS);

    if (!isNewInput && isCooldownActive) {
        return result;
    }

    // 6. Register Input
    result.up = up;
    result.down = down;
    result.left = left;
    result.right = right;
    result.select = select;
    result.back = back;

    // Update Ref State
    inputRef.current.menuInputCooldown = now;
    inputRef.current.lastInputMask = currentInputMask;

    return result;
};

export const pollGamepads = (
    inputRef: React.MutableRefObject<any>, 
    gameState: GameState, 
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    handleStart: (mode: any) => void,
    setGamepadConnected: (v: boolean) => void,
    gamepadConnected: boolean,
    playerVy: number,
    fuel: number,
    fuelCost: number
) => {
    const activePad = getGamepad();
    if (activePad) {
        if (!gamepadConnected) setGamepadConnected(true);
        
        // Start / Pause (Options / Menu)
        const startBtn = activePad.buttons[9]?.pressed || activePad.buttons[8]?.pressed;
        if (startBtn && !inputRef.current.pausePressed) {
            if (!gameState.isPlaying || gameState.isGameOver) {
                handleStart(gameState.gameMode); 
            } else {
                setGameState(prev => ({ ...prev, isPaused: !prev.isPaused })); 
            }
            inputRef.current.pausePressed = true;
        } else if (!startBtn) {
            inputRef.current.pausePressed = false;
        }

        // Gameplay Axis (Movement)
        const axisX = activePad.axes[0];
        inputRef.current.left = axisX < -Constants.GAMEPAD_DEADZONE || activePad.buttons[14]?.pressed;
        inputRef.current.right = axisX > Constants.GAMEPAD_DEADZONE || activePad.buttons[15]?.pressed;
        
        // Jump Button (A / Cross)
        const jumpBtn = activePad.buttons[0]?.pressed; 
        if (jumpBtn) {
            if (!inputRef.current.jumpIntent) {
                inputRef.current.jumpIntent = true;
                inputRef.current.jumpPressedTime = Date.now();
                // Only play sound if this is a fresh press and likely to jump (physics will validate grounding)
            }
        } else {
            inputRef.current.jumpIntent = false;
        }

        // Jetpack Button (B / Circle / RB / R1 / X / Square)
        // Allowing multiple bindings for comfort
        const jetpackBtn = activePad.buttons[1]?.pressed || activePad.buttons[2]?.pressed || activePad.buttons[5]?.pressed;
        
        if (jetpackBtn) {
            if (!inputRef.current.jetpack && !gameState.isPaused && gameState.isPlaying) {
                 if (fuel > 0) setGameState(prev => ({ ...prev, fuel: Math.max(0, prev.fuel - fuelCost) }));
            }
            inputRef.current.jetpack = true;
        } else {
            inputRef.current.jetpack = false;
        }
    }
};
