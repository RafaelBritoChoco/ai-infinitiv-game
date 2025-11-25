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
  LATERAL_BOUNCE = 'LATERAL_BOUNCE', // NEW: Launches player sideways in parabolic arc
  GLITCH = 'GLITCH' // NEW: Randomly disappears or gives low jump
}

export type CollectibleType = 'FUEL' | 'COIN' | 'HEART';

// Trophy Powers System
export interface TrophyPowers {
  extraLives: number;        // Additional lives (0-2)
  coinValueMultiplier: number;  // Multiplier for coin value (1.0 = normal)
  coinSpawnMultiplier: number;  // Multiplier for coin spawn rate (1.0 = normal)
  description: string;       // Power description for UI
}

export const TROPHY_POWERS: { [key: string]: TrophyPowers } = {
  trophy_gold: {
    extraLives: 2,
    coinValueMultiplier: 0.9,  // 10% less per coin (balanced)
    coinSpawnMultiplier: 2.0,  // 100% more coins spawn
    description: '👑 5 VIDAS • 2x MOEDAS • -10% VALOR'
  },
  trophy_silver: {
    extraLives: 1,
    coinValueMultiplier: 0.95,  // 5% less per coin
    coinSpawnMultiplier: 1.5,   // 50% more coins spawn
    description: '🥈 4 VIDAS • 1.5x MOEDAS • -5% VALOR'
  },
  trophy_bronze: {
    extraLives: 0,
    coinValueMultiplier: 0.97,  // 3% less per coin
    coinSpawnMultiplier: 1.25,  // 25% more coins spawn
    description: '🥉 3 VIDAS • 1.25x MOEDAS • -3% VALOR'
  }
};

// Character Challenge System - unlock characters by completing challenges
export interface CharacterChallenge {
  skinId: string;
  title: string;
  description: string;
  requirement: 'world_record' | 'altitude' | 'coins' | 'games' | 'combo' | 'no_damage' | 'jetpack' | 'perfect_jumps' | 'speed';
  targetValue: number;
  emoji: string;
}

export const CHARACTER_CHALLENGES: CharacterChallenge[] = [
  // CHOCO - Precisa ser #1 mundial
  { skinId: 'choco', title: '🏆 LENDÁRIO', description: 'Conquiste o 1º lugar no Ranking Global', requirement: 'world_record', targetValue: 1, emoji: '🍫' },
  
  // YURI (Alfinete) - Passar de 1000m
  { skinId: 'pin', title: '📍 ALPINISTA', description: 'Alcance 1000m de altitude', requirement: 'altitude', targetValue: 1000, emoji: '📍' },
  
  // CANTOR - Coletar 500 moedas em uma partida
  { skinId: 'singer', title: '🎤 MILIONÁRIO', description: 'Colete 500 moedas em uma única partida', requirement: 'coins', targetValue: 500, emoji: '🎤' },
  
  // TERRA - Jogar 50 partidas
  { skinId: 'earth', title: '🌍 VETERANO', description: 'Complete 50 partidas', requirement: 'games', targetValue: 50, emoji: '🌍' },
  
  // BAMBOO (Panda) - Fazer combo de 20
  { skinId: 'panda', title: '🐼 COMBO MASTER', description: 'Faça um combo de 20 pulos', requirement: 'combo', targetValue: 20, emoji: '🐼' },
  
  // LUNA (Coelha) - Terminar uma run sem tomar dano
  { skinId: 'bunny', title: '🐰 INTOCÁVEL', description: 'Alcance 500m sem tomar dano', requirement: 'no_damage', targetValue: 500, emoji: '🐰' },
  
  // DUSTY - Usar jetpack por 30 segundos total em uma partida
  { skinId: 'dirt', title: '🚀 PILOTO', description: 'Use o jetpack por 30s em uma partida', requirement: 'jetpack', targetValue: 30, emoji: '💨' },
  
  // CORINGA - Fazer 50 perfect jumps em uma partida
  { skinId: 'joker', title: '🃏 PERFEITO', description: 'Faça 50 pulos perfeitos em uma partida', requirement: 'perfect_jumps', targetValue: 50, emoji: '🃏' },
  
  // KONG - Passar de 2000m
  { skinId: 'gorilla', title: '🦍 REI DA SELVA', description: 'Alcance 2000m de altitude', requirement: 'altitude', targetValue: 2000, emoji: '🦍' },
  
  // TAKESHI - Alcançar 1500m em menos de 3 minutos
  { skinId: 'samurai', title: '⚔️ SPEEDRUNNER', description: 'Alcance 1500m em menos de 3 min', requirement: 'speed', targetValue: 1500, emoji: '⚔️' },
  
  // ACRE - Coletar 1000 moedas totais
  { skinId: 'acre', title: '🌳 COLECIONADOR', description: 'Colete 1000 moedas no total', requirement: 'coins', targetValue: 1000, emoji: '🌳' },
  
  // RIZZINI - Fazer combo de 30
  { skinId: 'biker', title: '🚴 RADICAL', description: 'Faça um combo de 30 pulos', requirement: 'combo', targetValue: 30, emoji: '🚴' },
  
  // CHOKITO - Jogar 100 partidas
  { skinId: 'chocolate', title: '🍫 VICIADO', description: 'Complete 100 partidas', requirement: 'games', targetValue: 100, emoji: '🍫' },
];

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
  bounceDirection?: number; // -1 (Left) or 1 (Right) for LATERAL_BOUNCE
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
  lore?: {
    EN: string;
    PT: string;
    IT: string;
  };
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
  skinId?: string; // Character skin used for this score
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
  mobileControlMode: 'BUTTONS' | 'TILT' | 'ARROWS' | 'JOYSTICK'; // NEW: Preference
  score: number;
  GYRO_SENSITIVITY: number;
  MOBILE_SENSITIVITY_MULTIPLIER: number;
  GAMEPAD_DEADZONE: number;
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
  hideMotionDebug?: boolean; // Hide motion visual indicators during gameplay
  invertMotion?: boolean; // Invert motion controls for rotated screen
  activeTrophyPowers?: TrophyPowers | null; // Trophy powers for current run
  coinValueMultiplier?: number; // Active coin value multiplier
  coinSpawnMultiplier?: number; // Active coin spawn multiplier
  notification?: { message: string, type: 'info' | 'success' | 'warning' } | null; // Global notification
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

export interface PlayerStats {
  gamesPlayed: number;
  totalCoinsCollected: number;
  totalJetpackTime: number;
  totalPerfectJumps: number;
  maxCombo: number;
  noDamageDistance: number;
  fastest1500m: number; // in seconds, 0 if not achieved
}
