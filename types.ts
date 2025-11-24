
import * as Constants from './constants';

export type GameConfig = {
  [K in keyof typeof Constants]: typeof Constants[K];
};

// Device detection utility
export const detectPerformanceMode = (): 'high' | 'low' => {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 2;

  // Budget device: <= 4 cores and <= 4GB RAM
  if (cores <= 4 && memory <= 4) {
    return 'low';
  }
  return 'high';
};


export enum PlatformType {
  STATIC = 'STATIC',
  MOVING = 'MOVING', // Standard linear movement
  SWAYING = 'SWAYING', // Leaf-like sine wave movement
  BREAKABLE = 'BREAKABLE', // Breaks on impact
  STICKY = 'STICKY', // Glues player on contact
  LATERAL_BOUNCE = 'LATERAL_BOUNCE' // NEW: Launches player sideways in parabolic arc
}

export type CollectibleType = 'FUEL' | 'COIN';

export interface Collectible {
  id: string;
  type: CollectibleType;
  x: number; // Relative to platform
  y: number; // Relative to platform
  width: number;
  height: number;
  collected: boolean;
  baseY: number; // For hovering animation
}

export interface Platform {
  id: number;
  x: number; // Current X
  y: number; // Current Y
  initialX: number; // Anchor for swaying
  width: number;
  height: number;
  type: PlatformType;
  velocityX?: number; // For linear moving
  swaySpeed?: number; // For leaf movement speed
  swayPhase?: number; // Random start point in sine wave
  broken?: boolean;
  respawnTimer?: number; // Time in ms until respawn (Test Mode)
  color: string;
  collectible?: Collectible; // New: Optional collectible on platform

  // Advanced Difficulty Props
  crumbleTimer?: number; // Current countdown
  maxCrumbleTimer?: number; // Total time before breaking (if sticky & high level)
  isCrumbling?: boolean; // Is the countdown active?
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 to 1
  color: string;
  size: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // 1.0 to 0
  velocity: number;
  size: number;
}

export interface CharacterSkin {
  id: string;
  name: string;
  color: string;
  pixels: number[][]; // 8x8 grid representation (1 = color, 0 = transparent)
}

export interface SaveNode {
  id: number;
  x: number;
  y: number;
  baseX: number;
  collected: boolean;
}

export interface LeaderboardEntry {
  id: string; // Unique ID to prevent duplicates
  name: string;
  score: number;
  date: string;
}

export interface ShopUpgrades {
  maxFuel: number; // Level 0-5
  efficiency: number; // Level 0-5 (Glide/Burn rate)
  luck: number; // Level 0-5 (Spawn rate)
  jump: number; // Level 0-5 (Jump Height)
  shield: number; // Count 0-3 (Consumable Saves)
  aerodynamics: number; // Level 0-5 (Reduces Ascent Drag)
}

export interface GameState {
  username: string;
  runId: string; // Unique ID for the current run to prevent double submission
  gameMode: 'NORMAL' | 'TEST';
  levelIndex: 1 | 2; // 1 = Sector 1 (Init), 2 = Sector 2 (Hard)
  levelType: 'CAMPAIGN' | 'RANDOM'; // New: Deterministic vs Chaos
  mobileControlMode: 'BUTTONS' | 'TILT'; // NEW: Preference
  score: number;
  highScore: number;
  maxAltitude: number; // New: Track all-time max height for unlocks
  totalCoins: number; // Persistent Currency
  runCoins: number; // Coins collected in current run
  fuel: number;
  health: number; // Current Health
  maxHealth: number; // Max Health
  isGameOver: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  isEditing: boolean; // Is the level editor active?
  isFreefallMode: boolean; // NEW: Special mode state
  isShopOpen: boolean; // New: UI State
  waitingForFirstJump: boolean; // New: Static Start State
  combo: number;
  selectedSkin: CharacterSkin; // Selected animal skin
  upgrades: ShopUpgrades; // Persistent Upgrades
  hitStop: number; // Frame freeze counter
  showHitboxes?: boolean; // Debug: Show hitboxes
  godMode?: boolean; // Debug: Invincibility
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  jumpCooldown: number; // Anti-Spam Timer
}
