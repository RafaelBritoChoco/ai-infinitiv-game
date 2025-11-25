
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Constants from '../constants';
import { Player, Platform, PlatformType, Particle, GameConfig, SaveNode, CharacterSkin, GameState, detectPerformanceMode } from '../types';
import { Play, Move, Trash2, PlusSquare, Save, AlertTriangle, Pause, Settings, Edit, Volume2, VolumeX } from 'lucide-react';
import './game/responsiveUI.css';

// --- Sub-Module Imports ---
import { SKINS, SETTINGS_GROUPS } from './game/assets';
import { SceneryObject, initBackground } from './game/background';
import { createPlatform } from './game/platforms';
import { generateSkin } from './game/aiSkin';
import { getWorldWidthAtHeight, getScaleAndOffset, getWorldPos } from './game/utils';
import { useGameLoop } from './game/useGameLoop';
import { soundManager } from './game/audioManager'; // Import Sound Manager
import { Persistence } from './game/persistence';
import { initResponsiveUI } from './game/responsiveUI';

// --- Custom Hooks ---
import { useGameController } from './game/hooks/useGameController';
import { useInputController } from './game/hooks/useInputController';

// --- UI Components ---
import { CalibrationModal, GameOverMenu, StartScreen, PauseMenu, ControlsModal, LeftSidebar, RightSidebar, ShopModal, TouchControls, PortraitLock, LayoutEditorModal, SensorDebugModal } from './game/ui';
import { DevEditor } from './game/DevEditor';
import { UserSettingsModal } from './game/UserSettingsModal';
import { VisualControlEditor, ControlsLayout } from './game/VisualControlEditor';
import { SkillTreeShop } from './game/SkillTreeShop';
import { VirtualJoystick } from './game/VirtualJoystick';

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Configuration State ---
    const configRef = useRef<GameConfig>({ ...Constants });
    const [showDebug, setShowDebug] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>('physics');
    const [forceUpdate, setForceUpdate] = useState(0);

    // --- Editor State ---
    const [editorTool, setEditorTool] = useState<'SELECT' | 'MOVE' | 'ADD' | 'DELETE'>('MOVE');
    const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null);

    // --- UI Local State ---
    const [availableSkins, setAvailableSkins] = useState<CharacterSkin[]>(SKINS);
    const [gamepadConnected, setGamepadConnected] = useState(false);
    const [gyroEnabled, setGyroEnabled] = useState(false);
    const [damageFlash, setDamageFlash] = useState(0);
    const [jetpackMode, setJetpackMode] = useState<'IDLE' | 'BURST' | 'GLIDE'>('IDLE');
    const [dangerWarning, setDangerWarning] = useState(false);
    const [isControlsOpen, setIsControlsOpen] = useState(false);
    const [showCalibration, setShowCalibration] = useState(false);
    const [showLayoutEditor, setShowLayoutEditor] = useState(false);
    const [showVisualEditor, setShowVisualEditor] = useState(false);
    const [controlLayout, setControlLayout] = useState({ scale: 1, x: 0, y: 0 });
    const [controlsLayout, setControlsLayout] = useState<ControlsLayout | null>(null);
    const [rotationLock, setRotationLock] = useState(true);
    const [tiltDebug, setTiltDebug] = useState(0);
    const [rawTiltDebug, setRawTiltDebug] = useState(0);
    const [showSensorDebug, setShowSensorDebug] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showDevEditor, setShowDevEditor] = useState(false);

    // Shadow Refs for Loop Stability
    const jetpackModeRef = useRef<'IDLE' | 'BURST' | 'GLIDE'>('IDLE');
    const damageFlashRef = useRef(0);
    const availableSkinsRef = useRef(SKINS);
    const isControlsOpenRef = useRef(false);
    const calibrationRef = useRef({ offset: 0, sensitivity: Constants.GYRO_SENSITIVITY, inverted: false });

    // --- INIT: Responsive UI System ---
    useEffect(() => {
        const cleanup = initResponsiveUI();
        return cleanup;
    }, []);

    // Sync Refs
    useEffect(() => { availableSkinsRef.current = availableSkins; }, [availableSkins]);
    useEffect(() => { isControlsOpenRef.current = isControlsOpen; }, [isControlsOpen]);

    const [aiPrompt, setAiPrompt] = useState("");
    const [isGeneratingSkin, setIsGeneratingSkin] = useState(false);
    const [showAiInput, setShowAiInput] = useState(false);

    // --- Refs (Passed to Controller) ---
    const playerRef = useRef<Player & {
        squashX: number,
        squashY: number,
        eyeBlinkTimer: number,
        facingRight: boolean
    }>({
        x: Constants.VIEWPORT_WIDTH / 2 - Constants.PLAYER_SIZE / 2,
        y: 0,
        width: Constants.PLAYER_SIZE,
        height: Constants.PLAYER_SIZE,
        vx: 0,
        vy: 0,
        isGrounded: false,
        squashX: 1,
        squashY: 1,
        eyeBlinkTimer: 0,
        facingRight: true,
        jumpCooldown: 0
    });

    const platformsRef = useRef<Platform[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const backgroundRef = useRef<SceneryObject[]>([]);
    const trailRef = useRef<{ x: number, y: number, life: number, skin: CharacterSkin, facingRight: boolean, scaleY: number }[]>([]);
    const saveNodesRef = useRef<SaveNode[]>([]);

    const inputRef = useRef({
        left: false, right: false, up: false, down: false,
        jetpack: false, jumpIntent: false, jumpPressedTime: 0,
        pausePressed: false, menuSelect: false, menuBack: false,
        menuInputCooldown: 0, lastInputMask: 0, tiltX: 0, targetTiltX: 0
    });

    const mouseRef = useRef({ isDown: false, x: 0, y: 0, dragOffsetX: 0, dragOffsetY: 0 });

    const cameraRef = useRef({ y: 0, targetY: 0, shake: 0 });
    const zoomRef = useRef(1.0);
    const fallStartRef = useRef<number | null>(null);
    const timeElapsedRef = useRef<number>(0);
    const lastPlatformYRef = useRef<number>(0);
    const platformGenCountRef = useRef<number>(0);

    // --- HOOKS ---

    // 1. Game Controller (Manages State, Logic, Menu, Start/Over)
    const {
        gameState, setGameState, stateRef,
        leaderboard, setLeaderboard, leaderboardRef, highScoreEntryStatusRef,
        showGameOverMenu, setShowGameOverMenu,
        menuIndex, setMenuIndex,
        handleStart, handleGameOver, handleMenuAction, updateMenuNavigation,
        buyUpgrade, handleSaveLeaderboardScore
    } = useGameController({
        configRef, canvasRef, playerRef, platformsRef, backgroundRef, cameraRef, zoomRef, fallStartRef, particlesRef, trailRef,
        timeElapsedRef, lastPlatformYRef, platformGenCountRef, saveNodesRef, damageFlashRef, jetpackModeRef, inputRef,
        availableSkinsRef, isControlsOpenRef, showCalibration, setShowCalibration, setIsControlsOpen
    });

    // 2. Input Controller (Keyboard, Mouse, Touch, Gyro)
    const { handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp, handleFirstInteraction } = useInputController({
        inputRef, stateRef, setGameState, configRef, canvasRef, playerRef, platformsRef, cameraRef, zoomRef, mouseRef,
        editorTool, setEditorTool, selectedPlatformId, setSelectedPlatformId, handleStart, showGameOverMenu, showCalibration,
        setShowCalibration, gyroEnabled, setGyroEnabled, setRawTiltDebug, setTiltDebug, calibrationRef,
        mobileControlMode: gameState.mobileControlMode // Pass as reactive prop
    });

    // --- Load Persistence ---
    // Orientation listener removed - handled by useInputController
    useEffect(() => {
        const savedCoins = Persistence.loadCoins();
        const savedUpgrades = Persistence.loadUpgrades();
        const savedHighScore = Persistence.loadHighScore();
        const savedMaxAlt = Persistence.loadMaxAltitude();
        const savedControlMode = Persistence.loadControlMode();
        const savedLeaderboard = Persistence.loadLeaderboard();
        const savedCal = Persistence.loadCalibration();
        const savedHideMotionDebug = localStorage.getItem('HIDE_MOTION_DEBUG') === 'true';
        const savedInvertMotion = localStorage.getItem('INVERT_MOTION') === 'true';

        if (savedCal) calibrationRef.current = savedCal;

        setGameState(prev => ({
            ...prev,
            highScore: savedHighScore,
            maxAltitude: savedMaxAlt,
            totalCoins: savedCoins,
            mobileControlMode: savedControlMode || 'BUTTONS',
            upgrades: { ...prev.upgrades, ...savedUpgrades },
            hideMotionDebug: savedHideMotionDebug,
            invertMotion: savedInvertMotion
        }));

        // Auto-enable gyro state if TILT mode was saved (for Android/non-strict envs)
        if (savedControlMode === 'TILT') {
            setGyroEnabled(true);
        }

        setLeaderboard(savedLeaderboard);

        // Initialize available skins from local storage if needed, or stick to default
        // If using AI skins, you might want to load them here too
    }, []);

    // --- Helpers ---
    const handleGenerateSkinWrapper = async () => {
        if (!aiPrompt.trim()) {
            alert('Digite uma descrição para o personagem!');
            return;
        }
        
        // Get API key from localStorage
        const apiKey = localStorage.getItem('GEMINI_API_KEY');
        if (!apiKey) {
            alert('⚠️ Configure sua API Key primeiro!\n\nVá em: SET → API Key (Gemini)');
            return;
        }

        soundManager.playClick();
        setIsGeneratingSkin(true);
        try {
            await generateSkin(aiPrompt, apiKey, setAvailableSkins, setGameState, setShowAiInput);
            setAiPrompt(''); // Clear prompt on success
        } catch (e: any) {
            console.error("AI Gen Error", e);
            alert(`❌ Erro ao gerar personagem:\n${e.message || 'Tente novamente.'}`);
        } finally {
            setIsGeneratingSkin(false);
        }
    };

    // --- Game Loop ---
    useGameLoop({
        canvasRef, containerRef, stateRef, playerRef, platformsRef, particlesRef,
        backgroundRef, trailRef, inputRef, cameraRef, zoomRef, fallStartRef,
        timeElapsedRef, lastPlatformYRef, platformGenCountRef, configRef,
        gameState, setGameState, setDamageFlash, setDangerWarning, jetpackMode,
        setJetpackMode, handleStart, gamepadConnected, setGamepadConnected,
        setShowGameOverMenu, editorTool, selectedPlatformId, damageFlash, showGameOverMenu,
        saveNodesRef, jetpackModeRef, damageFlashRef, jetpackAllowedRef: useRef(true),
        leaderboard, leaderboardRef, highScoreEntryStatusRef, onGameOver: handleGameOver, onMenuUpdate: updateMenuNavigation
    });

    return (
        <div className="flex h-screen w-full bg-black overflow-hidden font-sans select-none" onClick={handleFirstInteraction}>
            <LeftSidebar gameState={gameState} config={configRef.current} gamepadConnected={gamepadConnected} leaderboard={leaderboard} />

            {/* CENTER GAME AREA */}
            <div className="flex-1 relative flex justify-center items-center bg-[#050505] overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]">
                <div
                    ref={containerRef}
                    className="relative w-full h-full max-w-4xl shadow-2xl"
                    style={{ paddingBottom: gameState.isPlaying && typeof window !== 'undefined' && window.innerWidth < 768 ? '120px' : '0' }}
                >
                    <div className="absolute inset-0 bg-red-600 pointer-events-none z-20 mix-blend-overlay transition-opacity duration-100" style={{ opacity: damageFlash * 0.5 }} />

                    {dangerWarning && !gameState.isGameOver && (
                        <div className="absolute top-20 left-0 right-0 text-center z-30 animate-pulse">
                            <div className="inline-flex items-center gap-3 bg-red-900/80 text-red-100 px-6 py-2 rounded border border-red-500 font-black tracking-[0.2em] text-sm shadow-[0_0_20px_#ef4444]">
                                <AlertTriangle size={18} /> VELOCITY WARNING
                            </div>
                        </div>
                    )}

                    <canvas
                        ref={canvasRef}
                        className={gameState.isEditing ? "cursor-crosshair" : "cursor-default"}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onTouchStart={handleCanvasMouseDown}
                        onTouchMove={handleCanvasMouseMove}
                        onTouchEnd={handleCanvasMouseUp}
                    />

                    {gameState.isPlaying && !gameState.isGameOver && (
                        <div className="absolute top-6 right-6 z-40 flex flex-col gap-2">
                            <button
                                onMouseEnter={() => soundManager.playHover()}
                                onClick={() => { soundManager.playClick(); setGameState(p => ({ ...p, isPaused: !p.isPaused })); }}
                                className="p-3 bg-black/50 backdrop-blur text-cyan-400 rounded-full border border-cyan-500/50 hover:bg-cyan-900/50 transition-all shadow-[0_0_10px_#06b6d4]">
                                {gameState.isPaused ? <Play size={24} /> : <Pause size={24} />}
                            </button>
                            <button
                                onClick={() => {
                                    const currentVol = configRef.current.VOLUME_MASTER || 0.5;
                                    const newVol = currentVol > 0 ? 0 : 0.5;
                                    setConfig({ ...configRef.current, VOLUME_MASTER: newVol });
                                    soundManager.setVolumes(newVol, configRef.current.VOLUME_MUSIC || 0.4, configRef.current.VOLUME_SFX || 0.6);
                                }}
                                className={`p-3 backdrop-blur rounded-full border transition-all ${
                                    (configRef.current.VOLUME_MASTER || 0.5) > 0 
                                        ? 'bg-black/50 text-green-400 border-green-500/50 hover:bg-green-900/50' 
                                        : 'bg-black/50 text-red-400 border-red-500/50 hover:bg-red-900/50'
                                }`}>
                                {(configRef.current.VOLUME_MASTER || 0.5) > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                        </div>
                    )}

                    {gameState.isEditing && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 border border-cyan-500/50 p-2 rounded-full flex gap-3 shadow-[0_0_20px_rgba(6,182,212,0.3)] z-40 backdrop-blur">
                            <button onClick={() => setEditorTool('MOVE')} className={`p-3 rounded-full transition-all ${editorTool === 'MOVE' ? 'bg-cyan-600 text-white shadow-[0_0_10px_#0891b2]' : 'text-slate-400 hover:text-white'}`}><Move size={20} /></button>
                            <button onClick={() => setEditorTool('ADD')} className={`p-3 rounded-full transition-all ${editorTool === 'ADD' ? 'bg-green-600 text-white shadow-[0_0_10px_#16a34a]' : 'text-slate-400 hover:text-white'}`}><PlusSquare size={20} /></button>
                            <button onClick={() => setEditorTool('DELETE')} className={`p-3 rounded-full transition-all ${editorTool === 'DELETE' ? 'bg-red-600 text-white shadow-[0_0_10px_#dc2626]' : 'text-slate-400 hover:text-white'}`}><Trash2 size={20} /></button>
                            <div className="w-px bg-slate-700 mx-1"></div>
                            <button onClick={() => { if (platformsRef.current.length > 0) { Persistence.saveTestLevel(platformsRef.current); alert('Level Saved!'); } }} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"><Save size={20} /></button>
                            <button onClick={() => setGameState(p => ({ ...p, isEditing: false }))} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"><Play size={20} /></button>
                        </div>
                    )}
                </div>

                {gameState.isPaused && !gameState.isGameOver && !showDebug && (
                    <PauseMenu
                        setGameState={setGameState}
                        handleStart={() => handleStart(gameState.gameMode)}
                        selectedIndex={menuIndex}
                        onOpenCalibration={() => setShowCalibration(true)}
                        onOpenSettings={() => setShowSettings(true)}
                    />
                )}

                {!gameState.isPlaying && !gameState.isGameOver && !showCalibration && (
                    <StartScreen
                        gameState={gameState} setGameState={setGameState} availableSkins={SKINS}
                        showAiInput={showAiInput} setShowAiInput={setShowAiInput} aiPrompt={aiPrompt}
                        setAiPrompt={setAiPrompt} isGeneratingSkin={isGeneratingSkin}
                        handleGenerateSkin={handleGenerateSkinWrapper} handleStart={handleStart}
                        onOpenControls={() => setIsControlsOpen(true)}
                        onOpenCalibration={() => setShowCalibration(true)}
                        onOpenSettings={() => setShowSettings(true)}
                        selectedIndex={menuIndex}
                        gyroEnabled={gyroEnabled}
                        setGyroEnabled={setGyroEnabled}
                    />
                )}

                {isControlsOpen && (
                    <ControlsModal
                        onClose={() => setIsControlsOpen(false)}
                        currentMode={gameState.mobileControlMode}
                        setMobileControlMode={async (mode: 'BUTTONS' | 'TILT') => {
                            if (mode === 'TILT') {
                                // Request motion permission first
                                if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                                    try {
                                        const permission = await (DeviceOrientationEvent as any).requestPermission();
                                        if (permission === 'granted') {
                                            setGyroEnabled(true);
                                            setGameState((p: any) => ({ ...p, mobileControlMode: 'TILT' }));
                                        } else {
                                            alert('⚠️ Permission denied. Enable sensors in browser settings.');
                                        }
                                    } catch (e) {
                                        alert('❌ Error requesting sensor permission.');
                                    }
                                } else {
                                    // Android or desktop - no permission needed
                                    setGyroEnabled(true);
                                    setGameState((p: any) => ({ ...p, mobileControlMode: 'TILT' }));
                                }
                            } else {
                                setGyroEnabled(false);
                                setGameState(prev => ({ ...prev, mobileControlMode: mode }));
                            }
                        }}
                        onCalibrate={() => { setIsControlsOpen(false); setShowCalibration(true); }}
                        onOpenLayoutEditor={() => { setIsControlsOpen(false); setShowLayoutEditor(true); }}
                        rotationLock={rotationLock}
                        setRotationLock={setRotationLock}
                    />
                )}

                {showLayoutEditor && (
                    <LayoutEditorModal
                        onClose={() => setShowLayoutEditor(false)}
                        layout={controlLayout}
                        onSave={(newLayout: any) => {
                            setControlLayout(newLayout);
                            // Persistence.saveControlLayout(newLayout); // TODO: Implement persistence
                            setShowLayoutEditor(false);
                        }}
                    />
                )}

                {showDevEditor && (
                    <DevEditor
                        onClose={() => {
                            setShowDevEditor(false);
                            setGameState(prev => ({ ...prev, isPaused: false }));
                        }}
                        controlLayout={controlLayout}
                        setControlLayout={setControlLayout}
                        platformsRef={platformsRef}
                        config={configRef.current}
                        onForceUpdate={() => setForceUpdate(p => p + 1)}
                        gameState={gameState}
                        setGameState={setGameState}
                        cameraRef={cameraRef}
                    />
                )}

                {showCalibration && (
                    <CalibrationModal
                        isOpen={showCalibration}
                        onClose={() => setShowCalibration(false)}
                        configRef={configRef}
                    />
                )}

                {gameState.isGameOver && (
                    <GameOverMenu
                        gameState={gameState}
                        handleStart={handleStart}
                        setGameState={setGameState}
                        leaderboard={leaderboard}
                        onSaveScore={handleSaveLeaderboardScore}
                        selectedIndex={menuIndex}
                    />
                )}
                {gameState.isShopOpen && (
                    <SkillTreeShop gameState={gameState} setGameState={setGameState} />
                )}


            </div>

            <RightSidebar gameState={gameState} config={configRef.current} jetpackMode={jetpackMode} setShowDebug={setShowDebug} tiltDebug={tiltDebug} gyroEnabled={gyroEnabled} />




            {/* CONTROLS LAYER - STRICTLY GAMEPLAY ONLY */}
            {gameState.isPlaying && !gameState.isGameOver && !gameState.isPaused && (
                <>
                    {/* 1. Touch Controls (Buttons/Tilt/Joystick Actions) */}
                    <TouchControls
                        inputRef={inputRef}
                        mode={gameState.mobileControlMode}
                        layout={controlLayout}
                        controlsLayout={controlsLayout}
                        gameState={gameState}
                        hideMotionDebug={gameState.hideMotionDebug}
                    />

                    {/* 2. Virtual Joystick */}
                    {gameState.mobileControlMode === 'JOYSTICK' && (
                        <VirtualJoystick
                            size={150}
                            opacity={0.3}
                            onMove={(x, y) => {
                                inputRef.current.left = x < -0.2;
                                inputRef.current.right = x > 0.2;
                                inputRef.current.targetTiltX = x;
                            }}
                        />
                    )}
                </>
            )}

            <PortraitLock locked={rotationLock} />

            {showSensorDebug && <SensorDebugModal onClose={() => setShowSensorDebug(false)} />}

            {/* GLOBAL VERSION OVERLAY */}
            <div className="absolute bottom-1 right-1 text-[10px] text-slate-600 font-mono opacity-50 pointer-events-none" style={{ zIndex: Constants.Z_LAYERS.OVERLAY }}>
                {Constants.APP_VERSION}
            </div>

            {/* USER SETTINGS MODAL */}
            {showSettings && (
                <UserSettingsModal
                    onClose={() => setShowSettings(false)}
                    gameState={gameState}
                    setGameState={setGameState}
                    config={configRef.current}
                    setConfig={(newConfig: any) => {
                        configRef.current = { ...configRef.current, ...newConfig };
                        setForceUpdate(p => p + 1);
                    }}
                    onOpenDevConsole={() => {
                        setShowSettings(false);
                        setShowDevEditor(true);
                        setGameState((p: any) => ({ ...p, isPaused: true }));
                    }}
                    onOpenVisualEditor={() => {
                        setShowSettings(false);
                        setShowVisualEditor(true);
                    }}
                />
            )}

            {/* VISUAL CONTROL EDITOR */}
            <VisualControlEditor
                isOpen={showVisualEditor}
                onClose={() => setShowVisualEditor(false)}
                onSave={(newLayout) => {
                    setControlsLayout(newLayout);
                    setShowVisualEditor(false);
                }}
                initialLayout={controlsLayout || undefined}
            />
        </div>
    );
};

export default GameCanvas;
