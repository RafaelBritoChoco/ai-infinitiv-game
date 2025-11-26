import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Lock } from 'lucide-react';
import { CharacterSkin, PlatformType, CHARACTER_CHALLENGES } from '../../../types';
import { drawPlatformTexture } from '../platformRender';
import { drawCharacter } from '../playerRender';
import * as Constants from '../../../constants';
import { Persistence } from '../persistence';

export const CharacterPreviewModal = ({ skin, onClose, onSelectSkin, allSkins, unlockedSkins = [] }: { 
    skin: CharacterSkin; 
    onClose: () => void; 
    onSelectSkin: (skin: CharacterSkin) => void;
    allSkins: CharacterSkin[];
    unlockedSkins?: string[];
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const listRef = useRef<HTMLDivElement>(null);
    const [currentSkinIndex, setCurrentSkinIndex] = useState(() => {
        if (!skin) return 0;
        const idx = allSkins.findIndex(s => s.id === skin.id);
        return idx >= 0 ? idx : 0;
    });
    const [activeTab, setActiveTab] = useState<'preview' | 'jetpack' | 'perfect' | 'wrap'>('preview');
    const [seenSkins, setSeenSkins] = useState<string[]>([]);

    useEffect(() => {
        setSeenSkins(Persistence.loadSeenSkins());
    }, []);
    
    // Helper to check if locked
    const isLocked = (skinId: string) => {
        // Starter characters
        if (['ginger', 'kero'].includes(skinId)) return false;
        if (skinId.startsWith('trophy_')) return false; // Trophies handled separately
        if (skinId.startsWith('ai_')) return false;
        
        const challenge = CHARACTER_CHALLENGES.find(c => c.skinId === skinId);
        if (!challenge) return false;
        
        return !unlockedSkins.includes(skinId);
    };
    
    // Scroll to selected character when index changes
    useEffect(() => {
        if (listRef.current) {
            const selectedItem = listRef.current.children[currentSkinIndex] as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [currentSkinIndex]);
    
    const currentSkin = allSkins[currentSkinIndex] || skin || allSkins[0];

    if (!currentSkin) return null;
    
    // Animation state - platforms can dissolve like in game
    const stateRef = useRef({
        x: 140,
        y: 250,
        vx: 0,
        vy: 0,
        frame: 0,
        isGrounded: true,
        direction: 1,
        platforms: [] as { x: number; y: number; w: number; dissolve?: number; dissolving?: boolean }[],
        particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
        floatingTexts: [] as { x: number; y: number; text: string; life: number; color: string; vy: number }[],
        jetpackActive: false,
        jetpackTimer: 0,
        jetpackFuel: 100,
        perfectJumpReady: false,
        tutorialPhase: 0,
        cameraY: 0,
    });
    
    // Reset state when tab OR skin changes
    useEffect(() => {
        const state = stateRef.current;
        state.x = 300; // Centered in larger world
        state.y = 400;
        state.vx = 0;
        state.vy = 0;
        state.frame = 0;
        state.isGrounded = true;
        state.direction = 1;
        state.jetpackActive = false;
        state.jetpackTimer = 0;
        state.jetpackFuel = 100;
        state.perfectJumpReady = false;
        state.tutorialPhase = 0;
        state.particles = [];
        state.floatingTexts = [];
        state.cameraY = 0;
        
        // Set up platforms based on tab - REAL GAME SCALE
        if (activeTab === 'preview') {
            state.platforms = [
                { x: 100, y: 500, w: 400 }, // Main ground
                { x: 200, y: 350, w: 120 }, // Platform 1
                { x: 450, y: 250, w: 120 }, // Platform 2
                { x: 150, y: 150, w: 120 }, // Platform 3
            ];
        } else if (activeTab === 'jetpack') {
            state.platforms = [
                { x: 50, y: 500, w: 200 }, // Start
                { x: 450, y: 500, w: 200 }, // End (Gap of 200)
                { x: 250, y: 200, w: 100 }, // High platform
            ];
        } else if (activeTab === 'perfect') {
            state.platforms = [
                { x: 100, y: 500, w: 400 }, // Ground
                { x: 250, y: 300, w: 150 }, // Target platform
            ];
        } else if (activeTab === 'wrap') {
            state.platforms = [
                { x: -100, y: 500, w: 800 }, // Long ground
            ];
        }
    }, [activeTab, currentSkin]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const state = stateRef.current;
        
        const animate = () => {
            // Clear
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Camera Logic (Follow Player Y)
            let targetCamY = 0;
            if (state.y < 300) {
                targetCamY = state.y - 200;
            }
            state.cameraY += (targetCamY - state.cameraY) * 0.1;
            
            ctx.save();
            ctx.scale(0.5, 0.5); // Zoom out for tutorial
            ctx.translate(0, -state.cameraY); // Apply camera
            
            // Stars background (Parallax)
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            for (let i = 0; i < 60; i++) { 
                const sx = (i * 73 + state.frame * 0.1) % (canvas.width * 2);
                const sy = (i * 47 + state.cameraY * 0.5) % (canvas.height * 3);
                ctx.fillRect(sx, sy, 1, 1);
            }
            
            state.frame++;
            
            // --- SLOW MOTION LOGIC (Matrix Style) ---
            let timeScale = 1.0;
            
            // Slow motion for Perfect Jump (Landing Phase)
            if (activeTab === 'perfect' && state.vy > 0 && state.y > 350) {
                timeScale = 0.1; 
            }
            
            // Subtle Slow Motion for Preview (Jump Peak) - "Matrix" Feel
            if (activeTab === 'preview' && Math.abs(state.vy) < 5 && !state.isGrounded) {
                timeScale = 0.6;
            }

            // ========== TAB-SPECIFIC LOGIC ==========
            if (activeTab === 'preview') {
                // Auto movement - smoother zigzag with ACCELERATION
                const movePhase = state.frame % 180;
                let targetDir = 0;
                
                if (movePhase < 90) {
                    targetDir = 1;
                } else {
                    targetDir = -1;
                }
                
                // Apply Acceleration instead of setting velocity directly
                state.vx += targetDir * Constants.MOVE_ACCELERATION * 0.5 * timeScale; // 0.5 factor for relaxed preview

                // Auto jump when grounded
                if (state.isGrounded && state.frame % 90 === 45) {
                    state.vy = -Constants.WEAK_JUMP_FORCE;
                    state.isGrounded = false;
                    // Jump particles
                    for (let i = 0; i < 5; i++) {
                        state.particles.push({
                            x: state.x, y: state.y + 24,
                            vx: (Math.random() - 0.5) * 4, vy: Math.random() * 2,
                            life: 20, color: currentSkin.color || '#06b6d4'
                        });
                    }
                }
                
                // Jetpack occasionally
                if (state.frame % 300 === 150) {
                    state.jetpackActive = true;
                    state.jetpackTimer = 40;
                }
            } else if (activeTab === 'jetpack') {
                // Tutorial: show jetpack crossing gap
                const phase = Math.floor(state.frame / 120) % 4;
                
                if (phase === 0) {
                    // Walk right
                    state.vx += Constants.MOVE_ACCELERATION * 0.5 * timeScale;
                    state.direction = 1;
                    state.jetpackFuel = 100;
                } else if (phase === 1) {
                    // Jump and activate jetpack over gap
                    if (state.tutorialPhase !== 1) {
                        state.vy = -Constants.WEAK_JUMP_FORCE;
                        state.isGrounded = false;
                        state.tutorialPhase = 1;
                    }
                    state.jetpackActive = true;
                    state.vx += Constants.MOVE_ACCELERATION * 0.5 * timeScale; // Keep moving right
                } else if (phase === 2) {
                    // Land and walk left
                    state.jetpackActive = false;
                    state.vx -= Constants.MOVE_ACCELERATION * 0.5 * timeScale;
                    state.direction = -1;
                } else {
                    // Reset position
                    state.x = 50;
                    state.y = 500;
                    state.vx = 0;
                    state.vy = 0;
                    state.isGrounded = true;
                    state.tutorialPhase = 0;
                    state.jetpackFuel = 100;
                }
            } else if (activeTab === 'perfect') {
                // Tutorial: show perfect jump timing
                // Adjust phase calculation for slow motion
                // We use a separate counter for logic phases to not be affected by slow motion frame count?
                // Actually state.frame is incremented by 1 every loop.
                // If we want the logic to wait, we should maybe use a timer that respects timeScale?
                // For simplicity, let's keep logic based on frames, but since physics is slow, it will take longer to reach ground.
                
                // Reset if landed
                if (state.isGrounded && state.tutorialPhase === 1) {
                     // Wait a bit then reset
                     if (state.frame % 60 === 0) {
                        state.x = 100;
                        state.y = 500;
                        state.vy = 0;
                        state.isGrounded = true;
                        state.tutorialPhase = 0;
                     }
                }

                if (state.tutorialPhase === 0) {
                    // Jump up
                    if (state.isGrounded && state.frame % 60 === 0) {
                         state.vy = -Constants.WEAK_JUMP_FORCE * 0.8; // Normal jump
                         state.isGrounded = false;
                         state.tutorialPhase = 1; // In air
                         state.perfectJumpReady = false;
                    }
                }
                
                // Detect landing for Perfect Jump
                if (state.vy > 0 && state.y > 450) {
                    state.perfectJumpReady = true;
                } else {
                    state.perfectJumpReady = false;
                }
                
                // Auto Perfect Jump when very close
                if (state.y > 490 && state.vy > 0 && state.tutorialPhase === 1) {
                     // Trigger Perfect Jump
                     state.vy = -Constants.PERFECT_JUMP_FORCE;
                     state.tutorialPhase = 2; // Soaring
                     state.perfectJumpReady = false;
                     
                     // Floating Text
                     state.floatingTexts.push({
                        x: state.x, y: state.y - 40,
                        text: "PERFECT!!",
                        life: 60,
                        color: '#ec4899',
                        vy: -2
                    });

                    // Pink particles
                    for (let i = 0; i < 20; i++) {
                        state.particles.push({
                            x: state.x, y: state.y + 24,
                            vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 5,
                            life: 40, color: '#ec4899'
                        });
                    }
                }
            } else if (activeTab === 'wrap') {
                // Tutorial: show screen wrap - keep grounded
                state.vx += Constants.MOVE_ACCELERATION * 0.5 * timeScale;
                state.direction = 1;
                state.y = 290; // Keep on ground level
                state.vy = 0; // No vertical movement
            }
            
            // ========== PHYSICS ==========
            
            // ========== PHYSICS ==========
            
            // 1. Friction (Horizontal)
            state.vx *= Math.pow(Constants.FRICTION, timeScale);
            
            // Cap Speed
            const maxH = Constants.MAX_H_SPEED;
            state.vx = Math.max(-maxH, Math.min(maxH, state.vx));

            // 2. Jetpack - REAL GAME PHYSICS
            if (state.jetpackActive && state.jetpackFuel > 0) {
                state.jetpackTimer--;
                
                let force = Constants.JETPACK_FORCE;
                let fuelCost = Constants.JETPACK_FUEL_COST_PER_FRAME;
                let isBurst = false;

                // Burst vs Glide Logic (Same as Game)
                if (state.vy > 0) {
                    // Falling -> Burst
                    isBurst = true;
                    force = Constants.JETPACK_FORCE * 2.5;
                    fuelCost = Constants.JETPACK_FUEL_COST_PER_FRAME * 4.0;
                } else {
                    // Rising -> Glide
                    if (state.vy < -10) {
                        force = Constants.GRAVITY * 0.8;
                    } else {
                        force = Constants.GRAVITY * 1.2;
                    }
                    fuelCost = Constants.JETPACK_FUEL_COST_PER_FRAME * 0.5;
                }
                
                state.vy -= force * timeScale;
                state.jetpackFuel -= fuelCost * timeScale;
                
                if (state.jetpackTimer <= 0 && activeTab !== 'jetpack') {
                    state.jetpackActive = false;
                }
                
                // Particles
                if (state.frame % 2 === 0) {
                    const pColor = isBurst ? '#f97316' : '#22d3ee';
                    state.particles.push({
                        x: state.x + (state.direction * 10), 
                        y: state.y + 20,
                        vx: (Math.random() - 0.5) * 2, 
                        vy: 5 + Math.random() * 5,
                        life: 20, 
                        color: pColor
                    });
                }
            } else {
                // 3. Gravity & Air Resistance
                state.vy += Constants.GRAVITY * timeScale;
                
                if (state.vy < 0) {
                    // Rising
                    state.vy *= Math.pow(Constants.AIR_RESISTANCE_RISE, timeScale);
                } else {
                    // Falling
                    state.vy *= Math.pow(Constants.AIR_RESISTANCE, timeScale);
                }
            }
            
            // Cap fall speed
            if (state.vy > Constants.MAX_FALL_SPEED) state.vy = Constants.MAX_FALL_SPEED;
            
            // Apply Velocity
            state.x += state.vx * timeScale;
            state.y += state.vy * timeScale;
            
            // Screen wrap (horizontal) - Adjusted for larger world
            const worldWidth = canvas.width * 2; // Since we zoomed out 0.5
            if (activeTab === 'wrap') {
                if (state.x > worldWidth + 20) {
                    state.x = -20;
                    // Wrap effect particles
                    for (let i = 0; i < 5; i++) {
                        state.particles.push({
                            x: 5, y: state.y + Math.random() * 40 - 20,
                            vx: 3, vy: (Math.random() - 0.5) * 2,
                            life: 20, color: '#a855f7'
                        });
                    }
                }
            } else {
                // Normal boundary
                if (state.x < 20) state.x = 20;
                if (state.x > worldWidth - 20) state.x = worldWidth - 20;
            }
            
            // Platform collision - better physics matching the game
            state.isGrounded = false;
            const charHeight = (currentSkin.pixels?.length || 16) * 3;
            const playerBottom = state.y + charHeight / 2;
            const playerPrevBottom = playerBottom - state.vy;
            
            for (const plat of state.platforms) {
                // Skip fully dissolved platforms
                if (plat.dissolve !== undefined && plat.dissolve <= 0) continue;
                
                const platTop = plat.y;
                const platLeft = plat.x - 5;
                const platRight = plat.x + plat.w + 5;
                
                // Only collide when falling (vy >= 0) and was above platform before
                if (state.vy >= 0 && 
                    playerPrevBottom <= platTop + 5 &&
                    playerBottom >= platTop &&
                    state.x >= platLeft && 
                    state.x <= platRight) {
                    
                    state.y = platTop - charHeight / 2;
                    state.vy = 0;
                    state.isGrounded = true;
                    
                    // Start dissolving when player lands (except ground platforms)
                    if (plat.y < 300 && plat.dissolve === undefined) {
                        plat.dissolving = true;
                        plat.dissolve = 1.0;
                    }
                    break; // Only land on one platform
                }
            }
            
            // Update dissolving platforms
            state.platforms = state.platforms.map(plat => {
                if (plat.dissolving && plat.dissolve !== undefined) {
                    plat.dissolve -= 0.015; // Dissolve speed
                    // Create dissolve particles
                    if (Math.random() < 0.3 && plat.dissolve > 0) {
                        state.particles.push({
                            x: plat.x + Math.random() * plat.w,
                            y: plat.y,
                            vx: (Math.random() - 0.5) * 2,
                            vy: Math.random() * 2 + 1,
                            life: 15,
                            color: '#22d3ee'
                        });
                    }
                }
                return plat;
            }).filter(plat => plat.dissolve === undefined || plat.dissolve > 0);
            
            // Safety: don't fall below screen
            if (state.y > canvas.height - 30) {
                state.y = canvas.height - 54;
                state.vy = 0;
                state.isGrounded = true;
            }
            
            // ========== DRAWING ==========
            
            // Draw platforms using SHARED RENDERER
            for (const plat of state.platforms) {
                const dissolveAlpha = plat.dissolve !== undefined ? plat.dissolve : 1;
                if (dissolveAlpha <= 0) continue;
                
                ctx.globalAlpha = dissolveAlpha;
                
                // Construct mock platform for renderer
                const mockPlat: any = {
                    id: 0,
                    x: plat.x,
                    y: plat.y,
                    width: plat.w,
                    height: 10,
                    type: PlatformType.STATIC,
                    color: '#06b6d4',
                    broken: false,
                    isCrumbling: plat.dissolving,
                    crumbleTimer: plat.dissolve, // Hack to affect color
                    maxCrumbleTimer: 1.0
                };

                drawPlatformTexture(
                    ctx, 
                    mockPlat, 
                    plat.x, 
                    plat.y, 
                    plat.w, 
                    10, 
                    1.0, 
                    state.frame * 16, 
                    { isEditing: false, showHitboxes: false } as any, 
                    null, 
                    Constants as any
                );
                
                ctx.globalAlpha = 1;
            }
            
            // Draw particles
            state.particles = state.particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                ctx.globalAlpha = p.life / 20;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
                ctx.globalAlpha = 1;
                return p.life > 0;
            });

            // Draw Floating Texts (PERFECT!)
            state.floatingTexts = state.floatingTexts.filter(t => {
                t.y += t.vy;
                t.life--;
                ctx.globalAlpha = Math.min(1, t.life / 20);
                ctx.fillStyle = t.color;
                ctx.font = 'bold 20px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(t.text, t.x, t.y);
                ctx.globalAlpha = 1;
                return t.life > 0;
            });
            
            // Draw character
            const pixels = currentSkin.pixels || [];
            const pixelSize = 3;
            const charWidth = (pixels[0]?.length || 16) * pixelSize;
            const drawCharHeight = pixels.length * pixelSize;
            const startX = state.x - charWidth / 2;
            const startY = state.y - drawCharHeight / 2;
            
            // Perfect jump glow (pink)
            if (state.perfectJumpReady && activeTab === 'perfect') {
                ctx.shadowColor = '#ec4899';
                ctx.shadowBlur = 25;
                ctx.fillStyle = 'rgba(236,72,153,0.3)';
                ctx.beginPath();
                ctx.arc(state.x, state.y - 24, 35, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            // Draw character using shared renderer
            const charSize = 48;
            drawCharacter(
                ctx,
                currentSkin,
                state.x - charSize / 2,
                state.y - charSize,
                charSize,
                1,
                state.direction === 1,
                state.vy,
                0
            );
            
            // Jetpack flame
            if (state.jetpackActive) {
                ctx.fillStyle = '#f97316';
                ctx.fillRect(state.x - 4, state.y + drawCharHeight/2 - 5, 8, 10 + Math.random() * 10);
                ctx.fillStyle = '#facc15';
                ctx.fillRect(state.x - 2, state.y + drawCharHeight/2, 4, 6 + Math.random() * 10);
            }

            // Jetpack Fuel Bar
            if (activeTab === 'jetpack' && state.jetpackFuel < 100) {
                const barW = 40;
                const barH = 4;
                const barX = state.x - barW / 2;
                const barY = state.y - 60;
                
                ctx.fillStyle = '#334155';
                ctx.fillRect(barX, barY, barW, barH);
                
                ctx.fillStyle = state.jetpackFuel > 20 ? '#a855f7' : '#ef4444';
                ctx.fillRect(barX, barY, barW * (state.jetpackFuel / 100), barH);
            }
            
            ctx.restore(); // Restore scale for UI text

            // Overlay for Slow Motion
            if (activeTab === 'perfect' && timeScale < 1.0) {
                // Matrix-style overlay
                ctx.fillStyle = 'rgba(0, 20, 0, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.save();
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#00ff00';
                ctx.font = "bold italic 24px monospace";
                ctx.textAlign = "center";
                ctx.fillText("SLOW MOTION: TIMING", canvas.width / 2, 100);
                
                // Draw timing line
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.moveTo(0, 250); // Visual ground line (500 * 0.5)
                ctx.lineTo(canvas.width, 250);
                ctx.stroke();
                ctx.restore();
            }
            
            // ========== TUTORIAL TEXT ==========
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            
            if (activeTab === 'jetpack') {
                ctx.fillStyle = '#a855f7';
                ctx.fillText('🚀 JETPACK', canvas.width/2, 30);
                ctx.font = '11px monospace';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('Segure o botão roxo para voar', canvas.width/2, 50);
                ctx.fillText('Use para cruzar vãos!', canvas.width/2, 68);
            } else if (activeTab === 'perfect') {
                ctx.fillStyle = '#ec4899';
                ctx.fillText('⚡ PERFECT JUMP', canvas.width/2, 30);
                ctx.font = '11px monospace';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('Botão fica ROSA quando pronto', canvas.width/2, 50);
                ctx.fillText('Pula mais alto no momento certo!', canvas.width/2, 68);
                
                if (state.perfectJumpReady) {
                    ctx.fillStyle = '#ec4899';
                    ctx.font = 'bold 16px monospace';
                    ctx.fillText('🎯 AGORA! PULE!', canvas.width/2, canvas.height - 50);
                }
            } else if (activeTab === 'wrap') {
                ctx.fillStyle = '#a855f7';
                ctx.fillText('↔️ SCREEN WRAP', canvas.width/2, 30);
                ctx.font = '11px monospace';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('Saia por um lado da tela...', canvas.width/2, 50);
                ctx.fillText('...apareça do outro lado!', canvas.width/2, 68);
            }
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [currentSkin, activeTab]);
    
    const tabs = [
        { id: 'preview', label: '👁️', title: 'Preview' },
        { id: 'jetpack', label: '🚀', title: 'Jetpack' },
        { id: 'perfect', label: '⚡', title: 'Perfect' },
        { id: 'wrap', label: '↔️', title: 'Wrap' },
    ];
    
    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-start p-2 overflow-hidden">
            {/* Close button */}
            <button onClick={onClose} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white z-10">
                <X size={24} />
            </button>
            
            {/* CHARACTER LIST - Horizontal Gallery at TOP */}
            <div className="w-full max-w-md mt-1 mb-2 shrink-0">
                <p className="text-[10px] text-slate-500 text-center mb-1">← DESLIZE PARA VER TODOS →</p>
                <div 
                    ref={listRef}
                    className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 px-2 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {allSkins.map((s, i) => {
                        const isSelected = i === currentSkinIndex;
                        const locked = isLocked(s.id);
                        const isNew = unlockedSkins.includes(s.id) && !seenSkins.includes(s.id) && !['ginger', 'kero'].includes(s.id);
                        
                        return (
                            <button
                                key={s.id}
                                onClick={() => {
                                    setCurrentSkinIndex(i);
                                    if (isNew) {
                                        const newSeen = [...seenSkins, s.id];
                                        setSeenSkins(newSeen);
                                        Persistence.saveSeenSkins(newSeen);
                                    }
                                }}
                                className={`flex-shrink-0 flex flex-col items-center p-1.5 rounded-lg border-2 transition-all snap-center relative ${
                                    isSelected 
                                        ? 'border-cyan-400 bg-cyan-900/40 shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                        : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 opacity-60 hover:opacity-100'
                                }`}
                                style={{ minWidth: '50px' }}
                            >
                                {/* NEW Badge */}
                                {isNew && (
                                    <div className="absolute -top-2 -right-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse z-20 border border-white/20 shadow-sm">
                                        NEW
                                    </div>
                                )}

                                {/* Locked Overlay */}
                                {locked && (
                                    <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center rounded-md backdrop-blur-[1px]">
                                        <Lock size={14} className="text-slate-400" />
                                    </div>
                                )}

                                {/* Mini character */}
                                <div className={`w-8 h-8 ${isSelected ? 'animate-bounce' : ''} ${locked ? 'grayscale opacity-50' : ''}`} style={{ animationDuration: '0.6s' }}>
                                    <svg viewBox={`0 0 ${s.pixels?.length > 16 ? 24 : 16} ${s.pixels?.length > 16 ? 24 : 16}`} className="w-full h-full" shapeRendering="crispEdges">
                                        {(s?.pixels || []).map((row: number[], y: number) =>
                                            row.map((val: number, x: number) => {
                                                if (val === 0) return null;
                                                let fill = '#000000';
                                                if (val === 1) fill = '#0f172a';
                                                else if (val === 2) fill = s.color;
                                                else if (val === 3) fill = '#ffffff';
                                                else if (val === 4) fill = '#ffffff';
                                                else if (val === 5) fill = '#000000';
                                                else if (val === 6) fill = '#facc15';
                                                return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />;
                                            })
                                        )}
                                    </svg>
                                </div>
                                {/* Name */}
                                <span className={`text-[7px] font-bold uppercase truncate max-w-[45px] ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`}>
                                    {s.name || s.id}
                                </span>
                                {/* Index indicator */}
                                {isSelected && (
                                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
                {/* Position indicator */}
                <div className="flex justify-center gap-1 mt-1">
                    <span className="text-[10px] text-cyan-400 font-bold">{currentSkinIndex + 1}</span>
                    <span className="text-[10px] text-slate-600">/</span>
                    <span className="text-[10px] text-slate-500">{allSkins.length}</span>
                </div>
            </div>
            
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 w-full max-w-4xl px-4 overflow-y-auto">
                
                {/* LEFT: PREVIEW CANVAS */}
                <div className="flex flex-col items-center shrink-0">
                    {/* Title - Character Name */}
                    <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-1">
                        {currentSkin.name || currentSkin.id}
                    </h2>
                    
                    {/* Tab buttons */}
                    <div className="flex gap-1 mb-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                                title={tab.title}
                            >
                                {tab.label} {tab.title}
                            </button>
                        ))}
                    </div>
                    
                    {/* Canvas - slightly smaller */}
                    <div className="relative">
                        <canvas 
                            ref={canvasRef} 
                            width={280} 
                            height={320} 
                            className="rounded-xl border-2 border-slate-700 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                        />
                        
                        {/* Navigation arrows on canvas sides */}
                        <button 
                            onClick={() => setCurrentSkinIndex((prev) => (prev - 1 + allSkins.length) % allSkins.length)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 p-2 bg-slate-800/90 rounded-full text-white hover:bg-cyan-600 z-10 border border-slate-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        
                        <button 
                            onClick={() => setCurrentSkinIndex((prev) => (prev + 1) % allSkins.length)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-2 bg-slate-800/90 rounded-full text-white hover:bg-cyan-600 z-10 border border-slate-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* RIGHT: MISSION INFO (Only if locked) */}
                {isLocked(currentSkin.id) && (() => {
                    const challenge = CHARACTER_CHALLENGES.find(c => c.skinId === currentSkin.id);
                    return (
                        <div className="w-full max-w-[280px] md:max-w-xs bg-slate-900/90 border border-red-500/30 rounded-xl p-5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4 shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                <Lock size={24} className="text-red-400" />
                            </div>
                            
                            <h3 className="text-red-400 font-black text-lg uppercase tracking-widest mb-1">BLOQUEADO</h3>
                            <div className="h-px w-16 bg-red-500/30 mb-4"></div>
                            
                            {challenge ? (
                                <>
                                    <div className="text-4xl mb-2">{challenge.emoji}</div>
                                    <h4 className="text-white font-bold text-sm mb-2 uppercase">{challenge.title}</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed mb-4 border-l-2 border-red-500/30 pl-3 text-left w-full bg-black/30 p-2 rounded-r">
                                        {challenge.description}
                                    </p>
                                    
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div className="h-full bg-red-500/50 w-0 animate-pulse"></div>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-1 w-full text-right">PROGRESSO INDISPONÍVEL</p>
                                </>
                            ) : (
                                <p className="text-slate-500 text-xs">Complete missões secretas para desbloquear.</p>
                            )}
                        </div>
                    );
                })()}
            </div>
            
            {/* Action button - Select and Close */}
            <div className="flex gap-3 mt-3 w-full justify-center px-4 shrink-0 pb-2">
                {(() => {
                    const locked = isLocked(currentSkin.id);
                    
                    return (
                        <button
                            onClick={() => {
                                if (!locked) {
                                    onSelectSkin(currentSkin);
                                    onClose();
                                }
                            }}
                            disabled={locked}
                            className={`w-full max-w-sm py-3 font-bold rounded-xl text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 ${
                                locked 
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none opacity-50' 
                                    : 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:from-cyan-500 hover:to-purple-500'
                            }`}
                        >
                            {locked ? (
                                <>
                                    <Lock size={16} /> 
                                    BLOQUEADO
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    USAR {currentSkin.name || currentSkin.id}
                                </>
                            )}
                        </button>
                    );
                })()}
            </div>
        </div>
    );
};
