
import * as Constants from '../../constants';
import { GameConfig, GameState, LeaderboardEntry, ShopUpgrades } from '../../types';
import { soundManager } from './audioManager';

export const Persistence = {
    loadConfig: (): Partial<GameConfig> | null => {
        try {
            const saved = localStorage.getItem('NEON_CONFIG');
            if (saved) return JSON.parse(saved);
        } catch (e) { console.error("Config Load Error", e); }
        return null;
    },

    saveConfig: (config: GameConfig) => {
        localStorage.setItem('NEON_CONFIG', JSON.stringify(config));
    },

    loadHighScore: (): number => {
        const s = localStorage.getItem('NEON_HIGH_SCORE');
        return s ? (parseInt(s, 10) || 0) : 0;
    },

    saveHighScore: (score: number) => {
        localStorage.setItem('NEON_HIGH_SCORE', score.toString());
    },

    loadMaxAltitude: (): number => {
        const s = localStorage.getItem('NEON_MAX_ALTITUDE');
        return s ? (parseInt(s, 10) || 0) : 0;
    },

    saveMaxAltitude: (alt: number) => {
        localStorage.setItem('NEON_MAX_ALTITUDE', alt.toString());
    },

    loadCoins: (): number => {
        const s = localStorage.getItem('NEON_TOTAL_COINS');
        return s ? (parseInt(s, 10) || 0) : 0;
    },

    saveCoins: (coins: number) => {
        localStorage.setItem('NEON_TOTAL_COINS', coins.toString());
    },

    loadUpgrades: (): Partial<ShopUpgrades> => {
        try {
            const s = localStorage.getItem('NEON_UPGRADES');
            if (s) return JSON.parse(s);
        } catch (e) { }
        return {};
    },

    saveUpgrades: (upgrades: ShopUpgrades) => {
        localStorage.setItem('NEON_UPGRADES', JSON.stringify(upgrades));
    },

    loadControlMode: (): 'BUTTONS' | 'TILT' | null => {
        return localStorage.getItem('NEON_CONTROL_MODE') as 'BUTTONS' | 'TILT' | null;
    },

    saveControlMode: (mode: 'BUTTONS' | 'TILT') => {
        localStorage.setItem('NEON_CONTROL_MODE', mode);
    },

    loadCalibration: () => {
        try {
            const s = localStorage.getItem('NEON_CALIBRATION');
            if (s) return JSON.parse(s);
        } catch (e) { }
        return null;
    },

    saveCalibration: (data: any) => {
        localStorage.setItem('NEON_CALIBRATION', JSON.stringify(data));
    },

    fetchGlobalLeaderboard: async (): Promise<LeaderboardEntry[]> => {
        try {
            const res = await fetch('/api/leaderboard');
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            // Map API format to LeaderboardEntry
            return data.map((item: any, index: number) => ({
                id: index,
                name: item.name,
                score: item.score,
                date: new Date().toISOString()
            }));
        } catch (e) {
            console.warn("Global leaderboard fetch failed, using local.", e);
            return Persistence.loadLeaderboard();
        }
    },

    submitGlobalScore: async (name: string, score: number) => {
        try {
            await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score })
            });
        } catch (e) {
            console.error("Failed to submit global score", e);
        }
        // Always save locally too
        Persistence.saveScoreToLeaderboard(name, score);
    },

    loadLeaderboard: (): LeaderboardEntry[] => {
        try {
            const s = localStorage.getItem('NEON_LEADERBOARD');
            if (s) return JSON.parse(s);
        } catch (e) { }
        return [];
    },

    saveLeaderboard: (board: LeaderboardEntry[]) => {
        localStorage.setItem('NEON_LEADERBOARD', JSON.stringify(board));
    },

    saveScoreToLeaderboard: (name: string, score: number) => {
        const leaderboard = Persistence.loadLeaderboard();
        leaderboard.push({ id: Date.now().toString(), name, score, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        const top10 = leaderboard.slice(0, 10);
        Persistence.saveLeaderboard(top10);
        return top10;
    },

    loadTestLevel: () => {
        try {
            const s = localStorage.getItem('NEON_TEST_LEVEL');
            if (s) return JSON.parse(s);
        } catch (e) { }
        return null;
    },

    saveTestLevel: (data: any) => {
        localStorage.setItem('NEON_TEST_LEVEL', JSON.stringify(data));
    }
};
