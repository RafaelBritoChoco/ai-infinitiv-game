
import { CharacterSkin, Player } from '../../types';

export const drawPixelMatrix = (
    ctx: CanvasRenderingContext2D,
    matrix: number[][],
    x: number,
    y: number,
    pixelSize: number,
    colorMap: Record<number, string>
) => {
    if (!matrix) return;
    matrix.forEach((row, r) => {
        if (!row) return;
        row.forEach((val, c) => {
            if (val === 0) return;
            ctx.fillStyle = colorMap[val];
            ctx.fillRect(x + c * pixelSize, y + r * pixelSize, pixelSize, pixelSize);
        });
    });
};

export const drawSimpleSprite = (
    ctx: CanvasRenderingContext2D,
    matrix: number[][],
    x: number,
    y: number,
    size: number,
    colorMap: Record<number, string>,
    scaleX: number = 1.0
) => {
    if (!matrix) return;
    const gridLength = matrix.length || 10;
    const pixelSize = size / gridLength;
    const drawX = x + (size - (size * scaleX)) / 2; // Center alignment logic for spinning

    matrix.forEach((row, r) => {
        if (!row) return;
        row.forEach((val, c) => {
            if (val === 0) return;
            const color = colorMap[val];
            if (!color) return;

            ctx.fillStyle = color;

            // Calculate horizontal position with scaling (Spin effect)
            // We scale from center, so col moves towards center
            const centerCol = gridLength / 2;
            const dist = c - centerCol;
            const scaledDist = dist * scaleX;
            const finalC = centerCol + scaledDist;

            const dx = drawX + finalC * pixelSize;
            const dy = y + r * pixelSize;

            ctx.fillRect(dx, dy, Math.max(0.5, pixelSize * Math.abs(scaleX)) + 0.2, pixelSize + 0.2);
        });
    });
}

export const drawCharacter = (
    ctx: CanvasRenderingContext2D,
    skin: CharacterSkin,
    x: number,
    y: number,
    size: number,
    scaleY: number,
    facingRight: boolean,
    playerVy: number,
    eyeBlinkTimer: number,
    isGhost = false,
    isGlued = false, // New Prop for Sticky Start
    isWeedMode = false // New Prop for 420 Mode
) => {
    if (!skin || !skin.pixels) return; // Safety Check
    const gridLength = skin.pixels.length || 16; // Support 8x8, 12x12 or 16x16 skins
    const pixelSize = size / gridLength;

    // Calculate arm positions based on velocity
    let armOffset = 0;
    if (playerVy < -5) armOffset = 2; // Arms tucked (jump)
    else if (playerVy > 5) armOffset = -2; // Arms up (fall)

    // Apply squash/stretch center point logic
    const h = size * scaleY;
    const w = size * (1 / scaleY); // Preserve volume
    const drawX = x + (size - w) / 2;
    const drawY = y + (size - h); // Anchor to bottom

    // Draw Glue Effect at feet if waiting for first jump
    if (isGlued) {
        ctx.fillStyle = '#22c55e'; // Green Slime
        const feetY = drawY + size - pixelSize;
        for (let i = 0; i < 4; i++) {
            // Random slime pixels near feet
            const rx = drawX + (Math.random() * size);
            const ry = feetY + (Math.random() * 5);
            ctx.fillRect(rx, ry, pixelSize, pixelSize);
        }
    }

    const drawPixel = (row: number, col: number, val: number) => {
        if (val === 0) return;

        // Determine real draw coordinates relative to sprite grid
        let dx = drawX + (facingRight ? col : (gridLength - 1 - col)) * pixelSize;
        let dy = drawY + row * pixelSize;

        // Arm Logic (Cols near edge for 16x16, simplified)
        // If it's an arm pixel (approx cols 0-2 and 13-15 for 16x16), and roughly middle height
        if ((col < 3 || col > gridLength - 4) && row > gridLength / 3 && row < gridLength * 0.75) {
            dy -= armOffset * pixelSize;
        }

        // Color Mapping
        // Color Mapping
        if (skin.id === 'pp') {
            // Custom Palette for PP (Reference Match)
            if (val === 1) ctx.fillStyle = '#0f172a'; // Black (Hair/Beard/Frames)
            else if (val === 2) ctx.fillStyle = skin.color; // Skin Base
            else if (val === 3) ctx.fillStyle = '#ffffff'; // Smoke/Highlight
            else if (val === 4) ctx.fillStyle = '#f97316'; // Cigar Tip (Orange)
            else if (val === 5) ctx.fillStyle = '#60a5fa'; // Blue Glasses Lenses
            else if (val === 6) ctx.fillStyle = '#78350f'; // Cigar Brown
        } else {
            // Standard Palette
            if (val === 1) ctx.fillStyle = '#0f172a'; // Outline/Dark
            else if (val === 2) ctx.fillStyle = skin.color; // Main
            else if (val === 3) ctx.fillStyle = '#ffffff'; // Highlight
            else if (val === 4) ctx.fillStyle = isWeedMode ? '#ef4444' : '#ffffff'; // Eye White (Red in 420 mode)
            else if (val === 5) ctx.fillStyle = '#000000'; // Eye Pupil
            else if (val === 6) ctx.fillStyle = '#facc15'; // Extra
        }

        // Dynamic Eyes (Values 4 and 5)
        if (val === 4 || val === 5) {
            // Blinking
            if (eyeBlinkTimer < 100 && !isGhost) {
                ctx.fillStyle = skin.color; // Closed eye
            } else if (playerVy > 30 && !isGhost) {
                // Look down in panic
                dy += pixelSize;
            }
        }

        // Render pixel with slight gap for grid look or solid
        ctx.fillRect(dx, dy, pixelSize + 0.2, pixelSize + 0.2);
    };

    skin.pixels.forEach((row, r) => {
        if (!row) return;
        row.forEach((val, c) => drawPixel(r, c, val));
    });
};
