
import { GameConfig, GameState, Particle } from '../../types';

// Deterministic Random Number Generator (Linear Congruential Generator)
export class SeededRNG {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    // Returns 0-1
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

export const getRand = (salt: number, gameMode: string, genCount: number) => {
    if (gameMode === 'TEST') {
        const seed = genCount * 9301 + 49297 + salt * 123;
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    return Math.random();
};

export const getWorldWidthAtHeight = (y: number, config: GameConfig) => {
    const heightMeters = Math.abs(y) / 10;
    const expansion = heightMeters * (config.WORLD_EXPANSION_RATE || 0.25);
    return config.VIEWPORT_WIDTH + expansion;
};

export const getScaleAndOffset = (
    width: number,
    height: number,
    playerY: number,
    zoom: number,
    config: GameConfig,
    isFreefall: boolean = false
) => {
    const currentWorldWidth = getWorldWidthAtHeight(playerY, config);

    const effectiveWidth = currentWorldWidth / zoom;
    const scale = width / effectiveWidth;

    // In normal mode, player is at bottom (0.7). In freefall, player is at top (0.2) looking down.
    const centerOffsetY = height * (isFreefall ? 0.2 : 0.7);
    const offsetX = (width - (currentWorldWidth * scale)) / 2;

    return { scale, centerOffsetY, currentWorldWidth, offsetX };
};

export const getWorldPos = (
    screenX: number,
    screenY: number,
    width: number,
    height: number,
    playerY: number,
    camY: number,
    zoom: number,
    config: GameConfig,
    isFreefall: boolean = false
) => {
    const { scale, centerOffsetY, offsetX } = getScaleAndOffset(width, height, playerY, zoom, config, isFreefall);
    const worldY = ((screenY - centerOffsetY) / scale) + camY;
    const worldX = (screenX - offsetX) / scale;
    return { x: worldX, y: worldY };
};

export const spawnParticles = (
    particles: Particle[],
    x: number,
    y: number,
    count: number,
    color: string,
    explosive = false,
    config?: GameConfig
) => {
    // Performance mode limiting
    if (config) {
        const maxParticles = config.PERFORMANCE_MODE === 'low' ? config.MAX_PARTICLES_LOW : config.MAX_PARTICLES_HIGH;
        const currentCount = particles.length;
        if (currentCount >= maxParticles) {
            return; // Don't spawn if at limit
        }
        // Reduce spawn count if would exceed limit
        count = Math.min(count, maxParticles - currentCount);
    }

    for (let i = 0; i < count; i++) {
        const speed = explosive ? 30 : 15;
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            life: 1.0,
            color,
            size: Math.random() * 6 + 4
        });
    }
};
