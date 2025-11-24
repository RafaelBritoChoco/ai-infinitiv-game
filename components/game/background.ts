
import { PIXEL_ARTS } from './assets';
import * as Constants from '../../constants';

export interface SceneryObject {
    x: number;
    y: number; 
    width: number;
    height: number;
    color: string;
    parallaxFactor: number; 
    type: 'SKYLINE_FAR' | 'SKYLINE_NEAR' | 'STAR';
    points?: {x: number, y: number}[]; // For vector shapes
}

// Generates a random city skyline shape
const generateSkyline = (width: number, height: number, complexity: number): {x: number, y: number}[] => {
    const points = [];
    points.push({x: 0, y: height}); // Bottom Left
    
    let currentX = 0;
    while(currentX < width) {
        const stepW = 30 + Math.random() * 80;
        const stepH = 100 + Math.random() * (height - 150);
        
        points.push({x: currentX, y: height - stepH});
        points.push({x: currentX + stepW, y: height - stepH});
        
        currentX += stepW;
    }
    
    points.push({x: width, y: height}); // Bottom Right
    return points;
};

export const initBackground = (initWidth: number): SceneryObject[] => {
    const bgObjects: SceneryObject[] = [];
    
    // 1. Distant Stars (Simple dots)
    for(let i=0; i<50; i++) {
        bgObjects.push({
            x: Math.random() * initWidth,
            y: -Math.random() * 30000, 
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            color: '#ffffff',
            parallaxFactor: 0.02,
            type: 'STAR'
        });
    }

    // 2. Far Skyline (Silhouette) - Dark Purple
    // We create one massive object that repeats or is very wide
    bgObjects.push({
        x: 0,
        y: 800, 
        width: initWidth * 2, 
        height: 1000,
        color: '#1e1b4b', // Dark Indigo
        parallaxFactor: 0.1, 
        type: 'SKYLINE_FAR',
        points: generateSkyline(initWidth * 2, 1000, 20)
    });

    // 3. Near Skyline (Silhouette) - Darker with Neon Edges
    bgObjects.push({
        x: -200,
        y: 1000, 
        width: initWidth * 2.5,
        height: 800,
        color: '#020617', // Almost Black
        parallaxFactor: 0.2, 
        type: 'SKYLINE_NEAR',
        points: generateSkyline(initWidth * 2.5, 800, 40)
    });
    
    return bgObjects;
};

export const drawBackground = (
    ctx: CanvasRenderingContext2D, 
    background: SceneryObject[], 
    cameraY: number, 
    scale: number, 
    getScreenY: (y: number) => number,
    worldToScreenX: (x: number) => number,
    width: number, 
    height: number,
    timeElapsed: number
) => {
    // --- DYNAMIC ATMOSPHERE CALCULATION ---
    const altitude = Math.max(0, Math.min(1, -cameraY / 20000));
    const currentMeters = Math.abs(cameraY) / 10;
    
    // Sector 2 Transition Logic (Starts fading in at 2500m, full intensity at 3500m)
    // This creates a "Soft" transition to the harder difficulty zone visual
    const sector2Threshold = 3000;
    const transitionRange = 1000;
    const dangerRatio = Math.min(1, Math.max(0, (currentMeters - (sector2Threshold - 500)) / transitionRange));

    // --- BASE SKY (SECTOR 1 - BLUE/PURPLE) ---
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (altitude < 0.5) {
        // Synthwave Sunset
        gradient.addColorStop(0, '#0f172a'); // Deep Blue top
        gradient.addColorStop(0.5, '#312e81'); 
        gradient.addColorStop(1, '#4c1d95'); // Purple horizon
    } else {
        // Deep Space
        gradient.addColorStop(0, '#000000'); 
        gradient.addColorStop(1, '#1e1b4b'); 
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // --- DANGER OVERLAY (SECTOR 2 - RED/VOID) ---
    if (dangerRatio > 0) {
        const dangerGrad = ctx.createLinearGradient(0, 0, 0, height);
        dangerGrad.addColorStop(0, '#2d0606'); // Dark Blood Red
        dangerGrad.addColorStop(0.6, '#450a0a'); // Crimson
        dangerGrad.addColorStop(1, '#000000'); // Void
        
        ctx.save();
        ctx.globalAlpha = dangerRatio * 0.8; // Blend it in
        ctx.fillStyle = dangerGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    // --- RETRO SUN (The "Vaporwave" Sun) ---
    const sunY = getScreenY(2000 + altitude * 8000);
    const sunSize = 600 * scale;
    
    if (sunY > -sunSize) {
        const sunX = width / 2;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunSize, 0, sunY + sunSize);
        
        // Sun Colors shift based on danger
        if (dangerRatio > 0.5) {
             sunGrad.addColorStop(0, '#ffffff'); // White Core
             sunGrad.addColorStop(1, '#ef4444'); // Red Rim
        } else {
             sunGrad.addColorStop(0, '#facc15'); // Yellow
             sunGrad.addColorStop(1, '#db2777'); // Pink
        }

        ctx.save();
        ctx.shadowColor = dangerRatio > 0.5 ? '#ef4444' : '#db2777';
        ctx.shadowBlur = 40 + (dangerRatio * 20); // Pulse more in danger
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // Sun Stripes (Cuts)
        // The cuts color matches the horizon (Purple in Sec 1, Black/Red in Sec 2)
        ctx.fillStyle = altitude < 0.5 ? (dangerRatio > 0.5 ? '#450a0a' : '#4c1d95') : '#020617';
        
        for(let i=0; i<8; i++) {
            const cutHeight = (i * 4 + 10) * scale;
            const cutY = sunY + (i * 40 * scale);
            if (cutY < sunY + sunSize) {
                ctx.fillRect(sunX - sunSize, cutY, sunSize * 2, cutHeight);
            }
        }
        ctx.restore();
    }

    // --- VECTOR OBJECTS (Stars & Skylines) ---
    background.forEach(bg => {
        const apparentY = bg.y + (cameraY * (1 - bg.parallaxFactor));
        const sy = getScreenY(apparentY);
        
        // Parallax X
        const shiftX = (Math.sin(timeElapsed * 0.05) * 100 * bg.parallaxFactor) * scale;
        const sx = worldToScreenX(bg.x) + shiftX;

        if (bg.type === 'STAR') {
             if (altitude > 0.1) {
                 const twinkle = Math.random() > 0.95 ? 0 : 1;
                 ctx.globalAlpha = Math.max(0, altitude - 0.1) * twinkle;
                 // Stars turn slightly reddish in danger zone
                 ctx.fillStyle = dangerRatio > 0.5 ? '#fca5a5' : '#ffffff';
                 ctx.fillRect(sx, sy, bg.width * scale, bg.height * scale);
                 ctx.globalAlpha = 1.0;
             }
        }
        else if ((bg.type === 'SKYLINE_FAR' || bg.type === 'SKYLINE_NEAR') && bg.points) {
             // Draw Vector Shape
             const drawY = sy - (bg.height * scale); // Anchor bottom
             
             ctx.beginPath();
             ctx.moveTo(sx + bg.points[0].x * scale, drawY + bg.points[0].y * scale);
             
             for(let i=1; i<bg.points.length; i++) {
                 ctx.lineTo(sx + bg.points[i].x * scale, drawY + bg.points[i].y * scale);
             }
             ctx.closePath();

             ctx.fillStyle = bg.color;
             
             // Tint Buildings Red in Danger Zone
             if (dangerRatio > 0.1) {
                 // We draw the normal building, then overlay red
                 ctx.fill();
                 ctx.save();
                 ctx.globalAlpha = dangerRatio * 0.3;
                 ctx.fillStyle = '#7f1d1d'; // Red Tint
                 ctx.fill();
                 ctx.restore();
             } else {
                 ctx.fill();
             }

             // Neon Rim Light
             if (bg.type === 'SKYLINE_NEAR') {
                 // Rim turns form Cyan to Red
                 ctx.strokeStyle = dangerRatio > 0.5 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.3)';
                 ctx.lineWidth = 2 * scale;
                 ctx.stroke();
             }
        }
    });

    // --- FOREGROUND GRID (Floor) ---
    // Only visible when near bottom
    if (altitude < 0.2) {
        ctx.save();
        const horizonY = getScreenY(1000);
        const gridAlpha = 1.0 - (altitude * 5);
        ctx.globalAlpha = Math.max(0, gridAlpha);
        
        ctx.beginPath();
        // Grid turns Pink to Red
        ctx.strokeStyle = dangerRatio > 0.5 ? 'rgba(220, 38, 38, 0.5)' : 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = 1 * scale;

        // Vertical Lines (Perspective)
        const centerX = width / 2;
        for (let i = -15; i <= 15; i++) {
            const xBase = centerX + (i * 300 * scale);
            ctx.moveTo(xBase, height);
            ctx.lineTo(centerX + (i * 20 * scale), horizonY);
        }

        // Horizontal Lines (Moving)
        const gridSpeed = (timeElapsed * 150) % 300;
        for (let i = 0; i < 8; i++) {
            // Exponential spacing for depth perception
            const depth = i / 8;
            const yPos = height - (depth * depth * (height - horizonY)) + (gridSpeed * scale * depth * 0.1);
             
            if (yPos > horizonY && yPos < height) {
                ctx.moveTo(0, yPos);
                ctx.lineTo(width, yPos);
            }
        }
        ctx.stroke();
        ctx.restore();
    }
};
