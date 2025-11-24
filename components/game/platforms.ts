
import { Platform, PlatformType, GameConfig, Collectible, CollectibleType } from '../../types';
import { getRand, getWorldWidthAtHeight, SeededRNG } from './utils';
import * as Constants from '../../constants';

export const createPlatform = (
    refY: number,
    config: GameConfig,
    gameMode: 'NORMAL' | 'TEST',
    genCount: number,
    lastPlatXInput: number | undefined,
    luckLevel: number = 0,
    difficultyMultiplier: number = 1.0,
    hasJetpack: boolean = false,
    levelType: 'CAMPAIGN' | 'RANDOM' = 'CAMPAIGN'
): Platform => {
    const heightMeters = Math.abs(refY) / 10;
    const currentLevel = Math.floor(heightMeters / (config.LEVEL_HEIGHT || 800)) + 1;

    // --- DIFFICULTY CURVE (Linear Interpolation) ---
    // 0m = 0% difficulty, 5000m = 100% difficulty
    const maxDifficultyAltitude = 5000;
    let normalizedDifficulty = Math.min(1, heightMeters / maxDifficultyAltitude);

    // Apply curve (Ease-Out Quad) to make it get harder faster initially, then plateau?
    // No, user wants smoother. Linear is safest.
    // Actually, let's use a slight curve to keep early game easy.
    const difficulty = normalizedDifficulty;

    const rng = new SeededRNG(levelType === 'CAMPAIGN' ? genCount + 12345 : Math.random() * 999999);
    const getRandom = () => levelType === 'CAMPAIGN' ? rng.next() : Math.random();

    // Width: Starts at START_WIDTH, shrinks to END_WIDTH
    let width = config.PLATFORM_START_WIDTH - (difficulty * (config.PLATFORM_START_WIDTH - config.PLATFORM_END_WIDTH));
    width = Math.max(config.PLATFORM_END_WIDTH, width);

    let height = (config.PLATFORM_HEIGHT || 40);

    const r1 = getRandom();
    const r2 = getRandom();
    const r3 = getRandom();
    const r4 = getRandom();
    const r5 = getRandom();
    const r6 = getRandom();

    // Gap: Starts at GAP_MIN, grows to GAP_MAX
    const minGap = (config.PLATFORM_GAP_MIN || 110) + (difficulty * 20); // Base gap grows slightly
    const maxGap = (config.PLATFORM_GAP_MAX || 250) + (difficulty * 50); // Max gap grows significantly
    const gap = minGap + r1 * (maxGap - minGap);
    const newY = refY - gap;
    const currentWorldWidth = getWorldWidthAtHeight(newY, config);

    let lastPlatX = lastPlatXInput ?? currentWorldWidth / 2;

    // --- WIDE TRAVERSAL LOGIC (> 2800m) ---
    // Encourage using the screen wrap (left <-> right)
    const maxReachX = 300 + (difficulty * 300 * difficultyMultiplier);
    let bias = 0;
    if (lastPlatX < currentWorldWidth * 0.3) bias = 0.3;
    if (lastPlatX > currentWorldWidth * 0.7) bias = -0.3;

    // At high altitudes, occasionally force a cross-map jump
    const forceWideJump = heightMeters > 2800 && r2 > 0.7;
    const direction = forceWideJump ? (lastPlatX > currentWorldWidth / 2 ? -1 : 1) : ((r5 > 0.5 - bias) ? 1 : -1);

    let moveX = direction * (100 + r4 * maxReachX);
    if (forceWideJump) moveX = direction * (currentWorldWidth * 0.6); // Jump 60% of screen width

    let newX = lastPlatX + moveX;
    if (newX < 0) newX = 0;
    if (newX + width > currentWorldWidth) newX = currentWorldWidth - width;

    let type = PlatformType.STATIC;
    let color = '#92400e';
    let maxCrumbleTimer = undefined;

    if (currentLevel === 2) color = '#57534e';
    if (currentLevel >= 3) color = '#166534';
    if (difficultyMultiplier > 1.1) color = '#7f1d1d';

    let vx = 0;
    let swaySpeed = 0;
    let swayPhase = 0;

    if (gameMode === 'TEST') {
        color = '#dc2626';
        if (r2 < 0.5) type = PlatformType.SWAYING;
    } else {
        // --- STICKY PLATFORM LOGIC (Doctor of Math) ---
        // 1. Early Game (0-600m): Frequent to teach the mechanic.
        // 2. Mid Game (600-2800m): Sine wave clusters. They appear as "Rest Stops" before hard sections.
        // 3. Late Game (>2800m): Rare, and they CRUMBLE (Unstable).

        let stickyProb = 0;

        if (heightMeters < 600) {
            stickyProb = 0.35; // Very Common
        } else if (heightMeters < 2800) {
            // Sinusoidal Cluster Logic: Peaks every ~800m
            const clusterPhase = Math.sin(heightMeters / 120); // Period of roughly 800m
            if (clusterPhase > 0.7) stickyProb = 0.4; // High chance inside a cluster
            else stickyProb = 0.05; // Very rare outside clusters
        } else {
            // Late Game
            stickyProb = 0.15; // Occasional save point
        }

        if (r1 < stickyProb * difficultyMultiplier) {
            type = PlatformType.STICKY;
            color = '#84cc16'; // Green

            // UNSTABLE LOGIC
            if (heightMeters > 2800) {
                maxCrumbleTimer = 1.5; // 1.5 Seconds to live
                color = '#d97706'; // Amber warning color
            }
        }
        else if (heightMeters > 500 && r2 < (0.1 + difficulty * 0.4)) {
            type = PlatformType.MOVING;
            color = '#78350f';
            vx = (r3 > 0.5 ? 1 : -1) * (2 + (currentLevel * 0.5) + r4) * difficultyMultiplier;
        } else if (heightMeters > 1000 && r2 < (0.2 + difficulty * 0.4)) {
            type = PlatformType.SWAYING;
            color = '#3f6212';
            swaySpeed = (1 + (currentLevel * 0.2) + r3 * 2) * difficultyMultiplier;
            swayPhase = r4 * Math.PI * 2;
        } else if (heightMeters > 1500 && r3 < 0.10 && difficulty > 0.3) {
            // LATERAL BOUNCE PLATFORM (Parabolic Launch)
            type = PlatformType.LATERAL_BOUNCE;
            color = r4 > 0.5 ? '#f97316' : '#dc2626'; // Orange or Red
        }
    }

    let collectible: Collectible | undefined = undefined;
    const spawnChance = 0.20 + (luckLevel * Constants.UPGRADE_LUCK_BONUS);

    if (gameMode !== 'TEST' && width > 60 && r6 < spawnChance) {
        const isFuel = hasJetpack ? (r1 > 0.6) : false;
        collectible = {
            id: `c-${genCount}`,
            type: isFuel ? 'FUEL' : 'COIN',
            x: width / 2 - Constants.COLLECTIBLE_SIZE / 2,
            y: -Constants.COLLECTIBLE_SIZE - 10,
            baseY: -Constants.COLLECTIBLE_SIZE - 10,
            width: Constants.COLLECTIBLE_SIZE,
            height: Constants.COLLECTIBLE_SIZE,
            collected: false
        };
    }

    return {
        id: Math.random(),
        x: newX, y: newY, initialX: newX, width, height, type, velocityX: vx, swaySpeed, swayPhase,
        broken: false, respawnTimer: 0, color, collectible,
        maxCrumbleTimer, crumbleTimer: maxCrumbleTimer, isCrumbling: false
    };
};

export const updatePlatforms = (platforms: Platform[], dt: number, timeElapsed: number, currentWorldWidth: number, config: GameConfig) => {
    const timeScale = dt / (1000 / 60); // Normalize to 60 FPS

    platforms.forEach(p => {
        if (p.broken) {
            if (p.respawnTimer === undefined) p.respawnTimer = 0;
            p.respawnTimer += dt;
            if (p.respawnTimer > (config.PLATFORM_RESPAWN_DELAY || 2000)) {
                p.broken = false; p.respawnTimer = 0;
                // Reset crumble logic if it regenerates
                if (p.maxCrumbleTimer) {
                    p.crumbleTimer = p.maxCrumbleTimer;
                    p.isCrumbling = false;
                }
            }
            return;
        }

        // --- CRUMBLE LOGIC ---
        if (p.isCrumbling && p.crumbleTimer !== undefined) {
            p.crumbleTimer -= dt / 1000; // Convert ms to seconds
            if (p.crumbleTimer <= 0) {
                p.broken = true;
                p.respawnTimer = 0;
            }
        }

        if (p.collectible && !p.collectible.collected) {
            p.collectible.y = p.collectible.baseY + Math.sin(timeElapsed * 3 + p.id) * 5;
        }
        if (p.type === PlatformType.MOVING && p.velocityX) {
            p.x += p.velocityX * timeScale;
            if (p.x <= 0) { p.x = 0; p.velocityX *= -1; }
            if (p.x + p.width >= currentWorldWidth) { p.x = currentWorldWidth - p.width; p.velocityX *= -1; }
        } else if (p.type === PlatformType.SWAYING && p.swaySpeed) {
            // Sway is time-based, so it naturally handles dt via timeElapsed, but we can scale speed if needed.
            // Since it uses Math.sin(timeElapsed * speed), and timeElapsed is accumulated dt, it is already frame-rate independent!
            const t = timeElapsed * p.swaySpeed + (p.swayPhase || 0) + ((config.SWAY_AMPLITUDE || 100) / 100);
            p.x = p.initialX + Math.sin(t) * (config.SWAY_AMPLITUDE || 100);
        }
    });
};
