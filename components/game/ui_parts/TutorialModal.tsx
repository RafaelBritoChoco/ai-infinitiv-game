import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Check, Smartphone, ArrowUp, Zap, Rocket, Repeat, HelpCircle } from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { updatePlayerPhysics } from '../physics';
import { drawCharacter } from '../playerRender';
import { drawPlatformTexture } from '../platformRender';
import * as Constants from '../../../constants';
import { GameState, Player, Platform, PlatformType, GameConfig, Particle, FloatingText } from '../../../types';

// Mock Config
const MOCK_CONFIG: GameConfig = { ...Constants };

// Mock Game State
const INITIAL_GAME_STATE: GameState = {
    username: 'Tutorial',
    runId: 'tutorial',
    gameMode: 'NORMAL',
    levelIndex: 1,
    levelType: 'CAMPAIGN',
    mobileControlMode: 'BUTTONS',
    GYRO_SENSITIVITY: 1,
    MOBILE_SENSITIVITY_MULTIPLIER: 1,
    GAMEPAD_DEADZONE: 0.1,
    isPlaying: true,
    isGameOver: false,
    isPaused: false,
    score: 0,
    highScore: 0,
    totalCoins: 0,
    runCoins: 0,
    maxAltitude: 0,
    fuel: 100,
    health: 3,
    maxHealth: 3,
    isShopOpen: false,
    waitingForFirstJump: false,
    combo: 0,
    selectedSkin: { id: 'tutorial', name: 'Tutorial', color: '#06b6d4', pixels: [] },
    upgrades: { maxFuel: 1, efficiency: 1, jump: 1, aerodynamics: 1, luck: 1, shield: 0 },
    hitStop: 0,
    isEditing: false,
    isFreefallMode: false
};

const STEPS = [
    { id: 'intro', icon: HelpCircle, title: 'BEM-VINDO', desc: 'Aprenda a dominar a gravidade.' },
    { id: 'move', icon: Smartphone, title: 'MOVIMENTO', desc: 'Toque nas laterais ou incline o celular.' },
    { id: 'jump', icon: ArrowUp, title: 'PULO', desc: 'Pule automaticamente ao tocar o chão.' },
    { id: 'perfect', icon: Zap, title: 'PERFECT JUMP', desc: 'Toque na tela EXATAMENTE ao aterrissar para um super pulo!' },
    { id: 'jetpack', icon: Rocket, title: 'JETPACK', desc: 'Segure a tela no ar para voar.' },
    { id: 'wrap', icon: Repeat, title: 'SCREEN WRAP', desc: 'Atravesse as bordas da tela.' },
];

export const TutorialModal = ({ onClose, lang, gameState }: { onClose: () => void, lang: string, gameState?: GameState }) => {
    const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.EN;
    const [step, setStep] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    
    // Simulation State Refs
    const playerRef = useRef<Player>({
        x: 600 - 48, y: 400, vx: 0, vy: 0,
        width: 96, height: 96,
        isGrounded: true, facingRight: true,
        squashX: 1, squashY: 1,
        jumpCooldown: 0,
        invulnerabilityTimer: 0,
        flashTimer: 0,
        combo: 0,
        lastPlatformY: 500
    } as any);
    
    const platformsRef = useRef<Platform[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const floatingTextsRef = useRef<FloatingText[]>([]);
    
    // Use passed gameState skin or fallback
    const initialState = { ...INITIAL_GAME_STATE };
    if (gameState && gameState.selectedSkin) {
        initialState.selectedSkin = gameState.selectedSkin;
    }
    
    const gameStateRef = useRef<GameState>(initialState);
    const inputRef = useRef({ left: false, right: false, jetpack: false, jumpIntent: false, jumpPressedTime: 0, tiltX: 0 });
    const frameRef = useRef(0);
    const jetpackModeRef = useRef<'IDLE' | 'BURST' | 'GLIDE'>('IDLE');
    const jetpackAllowedRef = useRef(true);
    const damageFlashRef = useRef(0);
    const fallStartRef = useRef<number | null>(null);
    const saveNodesRef = useRef<any[]>([]);
    const fuelRef = useRef(100);
    const scoreRef = useRef(0);

    // Update skin if prop changes
    useEffect(() => {
        if (gameState && gameState.selectedSkin) {
            gameStateRef.current.selectedSkin = gameState.selectedSkin;
        }
    }, [gameState]);

    // Reset simulation for each step
    useEffect(() => {
        const p = playerRef.current;
        p.x = 600 - 48;
        p.y = 400;
        p.vx = 0;
        p.vy = 0;
        p.isGrounded = true;
        frameRef.current = 0;
        particlesRef.current = [];
        floatingTextsRef.current = [];
        inputRef.current = { left: false, right: false, jetpack: false, jumpIntent: false, jumpPressedTime: 0, tiltX: 0 };

        // Setup Platforms based on Step
        if (step === 1) { // Move
            platformsRef.current = [{ id: 1, x: 200, y: 600, w: 800, h: 32, type: PlatformType.STATIC, passed: false, initialX: 200, color: '#06b6d4', width: 800, height: 32 }];
        } else if (step === 2) { // Jump
            platformsRef.current = [
                { id: 1, x: 200, y: 600, w: 800, h: 32, type: PlatformType.STATIC, passed: false, initialX: 200, color: '#06b6d4', width: 800, height: 32 },
                { id: 2, x: 400, y: 400, w: 400, h: 32, type: PlatformType.STATIC, passed: false, initialX: 400, color: '#06b6d4', width: 400, height: 32 }
            ];
        } else if (step === 3) { // Perfect
            platformsRef.current = [{ id: 1, x: 200, y: 600, w: 800, h: 32, type: PlatformType.STATIC, passed: false, initialX: 200, color: '#06b6d4', width: 800, height: 32 }];
            p.y = 200; // Start in air
            p.isGrounded = false;
        } else if (step === 4) { // Jetpack
            platformsRef.current = [
                { id: 1, x: 100, y: 600, w: 300, h: 32, type: PlatformType.STATIC, passed: false, initialX: 100, color: '#06b6d4', width: 300, height: 32 },
                { id: 2, x: 800, y: 600, w: 300, h: 32, type: PlatformType.STATIC, passed: false, initialX: 800, color: '#06b6d4', width: 300, height: 32 }
            ];
            p.x = 200;
        } else if (step === 5) { // Wrap
            platformsRef.current = [{ id: 1, x: 200, y: 600, w: 800, h: 32, type: PlatformType.STATIC, passed: false, initialX: 200, color: '#06b6d4', width: 800, height: 32 }];
        } else {
            platformsRef.current = [{ id: 1, x: 200, y: 600, w: 800, h: 32, type: PlatformType.STATIC, passed: false, initialX: 200, color: '#06b6d4', width: 800, height: 32 }];
        }

    }, [step]);

    // Simulation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = () => {
            frameRef.current++;
            const frame = frameRef.current;
            const p = playerRef.current;
            
            // --- AUTO INPUT LOGIC ---
            if (step === 1) { // Move
                const phase = Math.floor(frame / 60) % 4;
                inputRef.current.left = phase === 0 || phase === 1;
                inputRef.current.right = phase === 2 || phase === 3;
            } else if (step === 2) { // Jump
                // Auto jump handled by physics if waitingForFirstJump is false
                // But here we simulate normal gameplay
                if (p.isGrounded && frame % 60 === 0) {
                    inputRef.current.jumpIntent = true;
                } else {
                    inputRef.current.jumpIntent = false;
                }
            } else if (step === 3) { // Perfect Jump
                // Reset if landed without perfect
                if (p.isGrounded && frame > 10 && p.y > 500) {
                    p.y = 200;
                    p.vy = 0;
                    p.isGrounded = false;
                    frameRef.current = 0;
                }
                
                // Trigger Perfect Jump Input right before landing
                // Platform is at 600. Player height 96. Landing at 504.
                // Trigger when very close to ground
                if (p.y > 480 && p.vy > 0) {
                    inputRef.current.jumpIntent = true;
                } else {
                    inputRef.current.jumpIntent = false;
                }
            } else if (step === 4) { // Jetpack
                if (p.x > 350 && p.x < 850) {
                    inputRef.current.jetpack = true;
                    inputRef.current.right = true;
                } else {
                    inputRef.current.jetpack = false;
                    inputRef.current.right = true;
                }
                if (p.x > 1000) p.x = 100;
            } else if (step === 5) { // Wrap
                inputRef.current.right = true;
                // Physics engine handles wrap
            }

            // --- SLOW MOTION LOGIC ---
            let dt = 16.66;
            // Slow down when falling and close to ground for Perfect Jump
            if (step === 3 && p.y > 350 && p.vy > 0) {
                dt = 16.66 * 0.1; // 10% speed for Extreme Slow Motion
            }

            // --- PHYSICS UPDATE ---
            updatePlayerPhysics({
                player: p as any,
                platforms: platformsRef.current,
                input: inputRef.current,
                config: MOCK_CONFIG,
                dt: dt,
                gameState: gameStateRef.current,
                setGameState: (u) => {
                    if (typeof u === 'function') gameStateRef.current = u(gameStateRef.current);
                    else gameStateRef.current = u;
                },
                particles: particlesRef.current,
                floatingTextsRef: floatingTextsRef,
                cameraShake: 0,
                setCameraShake: () => {},
                zoom: 1,
                setZoom: () => {},
                setDangerWarning: () => {},
                setDamageFlash: () => {},
                setJetpackMode: (m) => jetpackModeRef.current = m,
                jetpackMode: jetpackModeRef.current,
                jetpackModeRef: jetpackModeRef,
                jetpackAllowedRef: jetpackAllowedRef,
                damageFlashRef: damageFlashRef,
                fallStartRef: fallStartRef,
                timeElapsed: frame * 16,
                triggerExplosion: () => {},
                saveNodesRef: saveNodesRef,
                fuelRef: fuelRef,
                scoreRef: scoreRef,
                maxFuelCapacity: 100
            });

            // --- RENDER ---
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Grid/Background
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            for(let i=0; i<canvas.width; i+=50) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
            }
            for(let i=0; i<canvas.height; i+=50) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
            }

            // Platforms
            ctx.save();
            ctx.scale(0.5, 0.5); // Scale down to fit 1200 width into 600 canvas
            platformsRef.current.forEach(plat => {
                drawPlatformTexture(ctx, plat, plat.x, plat.y, plat.w, plat.h, 1, frame, gameStateRef.current, null, MOCK_CONFIG);
            });

            // Player
            drawCharacter(
                ctx, 
                gameStateRef.current.selectedSkin, 
                p.x, 
                p.y, 
                p.width, 
                p.squashY, 
                p.facingRight, 
                p.vy, 
                0, 
                false, 
                false, 
                false
            );
            
            // Particles
            particlesRef.current.forEach((part, i) => {
                part.life--;
                part.x += part.vx;
                part.y += part.vy;
                ctx.fillStyle = part.color;
                ctx.fillRect(part.x, part.y, part.size || 4, part.size || 4);
                if (part.life <= 0) particlesRef.current.splice(i, 1);
            });

            // Floating Text
            floatingTextsRef.current.forEach((txt, i) => {
                txt.life--;
                txt.y += txt.vy;
                ctx.fillStyle = txt.color;
                ctx.font = "bold 40px Arial";
                ctx.fillText(txt.text, txt.x, txt.y);
                if (txt.life <= 0) floatingTextsRef.current.splice(i, 1);
            });

            ctx.restore();

            // Overlay for Slow Motion
            if (step === 3 && dt < 16) {
                // Matrix-style overlay
                ctx.fillStyle = 'rgba(0, 20, 0, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.save();
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#00ff00';
                ctx.font = "bold italic 32px monospace";
                ctx.textAlign = "center";
                ctx.fillText("SLOW MOTION: TIMING", canvas.width / 2, 100);
                
                // Draw timing line
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.moveTo(0, 300); // Visual ground line (600 * 0.5)
                ctx.lineTo(canvas.width, 300);
                ctx.stroke();
                ctx.restore();
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [step]);

    const CurrentIcon = STEPS[step].icon;

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="max-w-4xl w-full bg-[#020617] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]">
                
                {/* Left Side: Simulation */}
                <div className="flex-1 bg-slate-900 relative overflow-hidden flex items-center justify-center border-r border-slate-800">
                    <canvas 
                        ref={canvasRef} 
                        width={600} 
                        height={400} 
                        className="w-full h-full object-contain bg-[#0f172a]"
                    />
                    
                    {/* Step Indicator Overlay */}
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-cyan-400">
                        SIMULATION_MODE: {step === 3 ? 'SLOW_MO' : 'REALTIME'}
                    </div>
                </div>

                {/* Right Side: Controls & Info */}
                <div className="w-full md:w-96 p-8 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-[#020617]">
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex gap-2">
                                {STEPS.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'}`} />
                                ))}
                            </div>
                            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/20">
                                <CurrentIcon size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2 italic tracking-tight">
                                {STEPS[step].title}
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                {STEPS[step].desc}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button 
                            onClick={() => setStep(s => Math.max(0, s - 1))}
                            disabled={step === 0}
                            className="p-4 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        
                        {step < STEPS.length - 1 ? (
                            <button 
                                onClick={() => setStep(s => s + 1)}
                                className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 group"
                            >
                                PRÓXIMO
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button 
                                onClick={onClose}
                                className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 group"
                            >
                                JOGAR AGORA
                                <Check size={20} className="group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
