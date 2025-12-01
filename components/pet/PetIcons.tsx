/**
 * Pixel Art Icons for Pet Hub
 * NO EMOJIS - Pure pixel art SVG icons
 */

import React from 'react';

// FOOD ICON (Burger/Apple)
export const FoodIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
        {/* Apple */}
        <rect x="6" y="2" width="1" height="1" fill="#8B4513" />
        <rect x="6" y="3" width="1" height="1" fill="#228B22" />
        <rect x="5" y="4" width="6" height="1" fill="#FF0000" />
        <rect x="4" y="5" width="8" height="1" fill="#FF0000" />
        <rect x="4" y="6" width="8" height="1" fill="#DC143C" />
        <rect x="4" y="7" width="8" height="1" fill="#DC143C" />
        <rect x="5" y="8" width="6" height="1" fill="#DC143C" />
        <rect x="6" y="9" width="4" height="1" fill="#B22222" />
        <rect x="7" y="10" width="2" height="1" fill="#8B0000" />
        {/* Highlight */}
        <rect x="7" y="5" width="2" height="1" fill="#FF6B6B" />
    </svg>
);

// PLAY ICON (Ball)
export const PlayIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
        {/* Ball */}
        <rect x="6" y="4" width="4" height="1" fill="#4169E1" />
        <rect x="5" y="5" width="6" height="1" fill="#4169E1" />
        <rect x="4" y="6" width="8" height="1" fill="#4169E1" />
        <rect x="4" y="7" width="8" height="1" fill="#1E90FF" />
        <rect x="4" y="8" width="4" height="1" fill="#1E90FF" />
        <rect x="8" y="8" width="4" height="1" fill="#FFD700" />
        <rect x="5" y="9" width="6" height="1" fill="#FFD700" />
        <rect x="6" y="10" width="4" height="1" fill="#FFA500" />
        {/* Highlight */}
        <rect x="7" y="5" width="1" height="1" fill="#87CEEB" />
        <rect x="8" y="6" width="1" height="1" fill="#87CEEB" />
    </svg>
);

// CLEAN ICON (Broom/Soap)
export const CleanIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
        {/* Soap bubble */}
        <rect x="4" y="4" width="4" height="4" fill="#87CEEB" />
        <rect x="3" y="5" width="1" height="2" fill="#4682B4" />
        <rect x="8" y="5" width="1" height="2" fill="#4682B4" />
        <rect x="4" y="3" width="4" height="1" fill="#4682B4" />
        <rect x="4" y="8" width="4" height="1" fill="#4682B4" />
        {/* Sparkles */}
        <rect x="9" y="3" width="1" height="1" fill="#FFFFFF" />
        <rect x="11" y="5" width="1" height="1" fill="#FFFFFF" />
        <rect x="2" y="9" width="1" height="1" fill="#FFFFFF" />
        <rect x="10" y="10" width="1" height="1" fill="#FFFFFF" />
    </svg>
);

// SHOP ICON (Coin/Bag)
export const ShopIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
        {/* Coin */}
        <rect x="6" y="4" width="4" height="1" fill="#DAA520" />
        <rect x="5" y="5" width="6" height="1" fill="#FFD700" />
        <rect x="4" y="6" width="8" height="1" fill="#FFD700" />
        <rect x="4" y="7" width="8" height="1" fill="#FFA500" />
        <rect x="4" y="8" width="8" height="1" fill="#FF8C00" />
        <rect x="5" y="9" width="6" height="1" fill="#FF8C00" />
        <rect x="6" y="10" width="4" height="1" fill="#DAA520" />
        {/* Symbol $ */}
        <rect x="7" y="6" width="2" height="1" fill="#FFFFFF" />
        <rect x="7" y="8" width="2" height="1" fill="#FFFFFF" />
        <rect x="8" y="7" width="1" height="1" fill="#FFFFFF" />
    </svg>
);

// CLOSE/EXIT ICON (X)
export const ExitIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
        {/* X shape */}
        <rect x="4" y="4" width="1" height="1" fill="#FFFFFF" />
        <rect x="11" y="4" width="1" height="1" fill="#FFFFFF" />
        <rect x="5" y="5" width="1" height="1" fill="#FFFFFF" />
        <rect x="10" y="5" width="1" height="1" fill="#FFFFFF" />
        <rect x="6" y="6" width="1" height="1" fill="#FFFFFF" />
        <rect x="9" y="6" width="1" height="1" fill="#FFFFFF" />
        <rect x="7" y="7" width="2" height="2" fill="#FFFFFF" />
        <rect x="6" y="9" width="1" height="1" fill="#FFFFFF" />
        <rect x="9" y="9" width="1" height="1" fill="#FFFFFF" />
        <rect x="5" y="10" width="1" height="1" fill="#FFFFFF" />
        <rect x="10" y="10" width="1" height="1" fill="#FFFFFF" />
        <rect x="4" y="11" width="1" height="1" fill="#FFFFFF" />
        <rect x="11" y="11" width="1" height="1" fill="#FFFFFF" />
    </svg>
);

// EGG ICON (For adoption)
export const EggIcon: React.FC<{ size?: number; cracked?: boolean }> = ({ size = 64, cracked = false }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
        {/* Egg body */}
        <rect x="6" y="3" width="4" height="1" fill="#FFF8DC" />
        <rect x="5" y="4" width="6" height="1" fill="#FFF8DC" />
        <rect x="4" y="5" width="8" height="1" fill="#FFFACD" />
        <rect x="4" y="6" width="8" height="1" fill="#FFFACD" />
        <rect x="4" y="7" width="8" height="1" fill="#FFF8DC" />
        <rect x="4" y="8" width="8" height="1" fill="#FFF8DC" />
        <rect x="4" y="9" width="8" height="1" fill="#F5DEB3" />
        <rect x="5" y="10" width="6" height="1" fill="#F5DEB3" />
        <rect x="5" y="11" width="6" height="1" fill="#DEB887" />
        <rect x="6" y="12" width="4" height="1" fill="#DEB887" />

        {/* Crack lines if cracked */}
        {cracked && (
            <>
                <rect x="6" y="5" width="1" height="3" fill="#8B7355" />
                <rect x="7" y="6" width="2" height="1" fill="#8B7355" />
                <rect x="9" y="7" width="1" height="2" fill="#8B7355" />
            </>
        )}

        {/* Highlight */}
        <rect x="7" y="5" width="2" height="1" fill="#FFFFFF" opacity="0.6" />
    </svg>
);
