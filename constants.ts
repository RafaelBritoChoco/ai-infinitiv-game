

// Physics Constants (Recalibrated for Snappier Feel)
// Physics Constants (Recalibrated for Slower, Floatier Feel)
export const GRAVITY = 0.65; // Was 1.2
export const AIR_RESISTANCE = 0.99;
export const AIR_RESISTANCE_RISE = 0.95;
export const FRICTION = 0.92; // Was 0.88 (Less friction = smoother stop)
export const MOVE_ACCELERATION = 1.8; // Was 2.5 (Less twitchy)
export const MAX_H_SPEED = 12; // Was 15
export const MAX_FALL_SPEED = 100; // Increased from 45 - CRITICAL: allows acceleration for realistic physics
export const LETHAL_FALL_SPEED = 50; // Lowered from 60 - death threshold
export const MAX_RISE_SPEED = -200;
export const HITSTOP_FRAMES = 4;

// Level 2 Modifiers
export const LVL2_GRAVITY_MULT = 1.1;
export const LVL2_GAP_MULT = 1.1;
export const UNLOCK_ALTITUDE_LVL2 = 5000;

// Freefall Mode Constants
export const CRITICAL_FALL_SPEED = 9999;
export const FREEFALL_MIN_ALTITUDE = 99999;
export const SAVE_NODE_SPACING = 300;
export const FREEFALL_GRAVITY_MULT = 1.1;

// Health & Damage
export const MAX_HEALTH = 3;
export const SAFE_FALL_SPEED = 40; // Adjusted for new max fall speed
export const FALL_DAMAGE_MULTIPLIER = 1;

// Jump Mechanics
export const WEAK_JUMP_FORCE = 42; // Was 68
export const PERFECT_JUMP_FORCE = 65; // Was 98
export const PARRY_WINDOW_MS = 150; // Slightly wider window
export const JUMP_COOLDOWN_MS = 250;

// Jetpack Mechanics
export const JETPACK_FORCE = 0.12; // Was 0.18
export const JETPACK_FUEL_MAX = 0;
export const JETPACK_STARTING_FUEL = 0;
export const JETPACK_FUEL_COST_PER_FRAME = 0.8;
export const JETPACK_IGNITION_COST = 8;
export const FUEL_REGEN_ON_LAND = 8.0;

// World Generation
export const VIEWPORT_WIDTH = 1200;
export const WORLD_EXPANSION_RATE = 0;
export const PLAYER_SIZE = 80;
export const PLATFORM_GAP_MIN = 110; // Was 130 (Easier start)
export const PLATFORM_GAP_MAX = 250;
export const LEVEL_HEIGHT = 1200;

// Camera & Visibility
export const PLATFORM_DESPAWN_BUFFER = 2000;
export const PLATFORM_RESPAWN_DELAY = 1200;
export const ZOOM_START_THRESHOLD = 200;
export const MAX_ZOOM_OUT = 4.5;
export const ZOOM_DEPTH = 20000;
export const CAMERA_LOOKAHEAD_FALLING = 20; // Default lookahead value

// Platform Progression
export const PLATFORM_START_WIDTH = 280; // Wider starting platforms (was 220)
export const PLATFORM_END_WIDTH = 60;
export const PLATFORM_HEIGHT = 40;
export const PROGRESSION_STEP = 100;

// Leaf Motion
export const SWAY_AMPLITUDE = 100;

// Controls
export const GYRO_SENSITIVITY = 35; // Increased from 15 per user request
export const MOBILE_SENSITIVITY_MULTIPLIER = 2.5; // New multiplier for mobile inputs
export const GAMEPAD_DEADZONE = 0.1;

// Audio
export const VOLUME_MASTER = 0.5;
export const VOLUME_MUSIC = 0.4;
export const VOLUME_SFX = 0.6;

// --- ECONOMY & COLLECTIBLES ---
export const COLLECTIBLE_SIZE = 36;
export const FUEL_REFILL_AMOUNT = 35;
export const COIN_VALUE = 15;

// Shop Upgrade Costs & Multipliers
export const UPGRADE_COST_BASE = 150;
export const UPGRADE_COST_SCALE = 1.8;

// Per Level Benefits
export const UPGRADE_FUEL_BONUS = 25;
export const UPGRADE_EFFICIENCY_BONUS = 0.10;
export const UPGRADE_LUCK_BONUS = 0.05;
export const UPGRADE_JUMP_BONUS = 5;
export const UPGRADE_AERODYNAMICS_BONUS = 0.014;
export const SHIELD_BOUNCE_FORCE = 180;

// Item Costs
export const ITEM_SHIELD_COST = 150;

// --- PERFORMANCE SETTINGS ---
export const PERFORMANCE_MODE: 'auto' | 'high' | 'low' = 'auto';
export const MAX_PARTICLES_HIGH = 200;
export const MAX_PARTICLES_LOW = 20;
export const MAX_PLATFORMS_HIGH = 100;
export const MAX_PLATFORMS_LOW = 30;
export const ENABLE_PLATFORM_TEXTURES: boolean = true;
export const ENABLE_LEAF_ANIMATION: boolean = true;
export const ENABLE_SCREEN_EFFECTS: boolean = true;
export const ENABLE_BACKDROP_BLUR: boolean = true;

// Application version
export const APP_VERSION = 'v5.2.0';

// --- Z-INDEX LAYERS ---
export const Z_LAYERS = {
    GAME: 0,
    UI: 100,
    MODAL: 200,
    OVERLAY: 9999
};
export const INPUT_THROTTLE_MS_HIGH = 16; // 60fps
export const INPUT_THROTTLE_MS_LOW = 33; // 30fps

