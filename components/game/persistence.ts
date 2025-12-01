import * as Constants from '../../constants';
import { GameConfig, GameState, LeaderboardEntry, ShopUpgrades, PlayerStats } from '../../types';
import { soundManager } from './audioManager';

let CURRENT_PROFILE = 'guest';
const getKey = (key: string) => `${CURRENT_PROFILE}_${key}`;

export const Persistence = {
    setProfile: (username: string) => {
        CURRENT_PROFILE = username || 'guest';
    },

    getProfile: () => CURRENT_PROFILE,

    resetProfile: () => {
        const keys = Object.keys(localStorage);
        const prefix = `${CURRENT_PROFILE}_`;
        keys.forEach(k => {
            if (k.startsWith(prefix)) {
                localStorage.removeItem(k);
            }
        });
    },

    loadConfig: (): Partial<GameConfig> | null => {
        try {
            const saved = localStorage.getItem(getKey('NEON_CONFIG'));
            if (saved) return JSON.parse(saved);
        } catch (e) { console.error("Config Load Error", e); }
        return null;
    },

    saveConfig: (config: GameConfig) => {
        localStorage.setItem(getKey('NEON_CONFIG'), JSON.stringify(config));
    },

    loadHighScore: (): number => {
        const s = localStorage.getItem(getKey('NEON_HIGH_SCORE'));
        return s ? (parseInt(s, 10) || 0) : 0;
    },

    saveHighScore: (score: number) => {
        localStorage.setItem(getKey('NEON_HIGH_SCORE'), score.toString());
    },

    loadMaxAltitude: (): number => {
        const s = localStorage.getItem(getKey('NEON_MAX_ALTITUDE'));
        return s ? (parseInt(s, 10) || 0) : 0;
    },

    saveMaxAltitude: (alt: number) => {
        localStorage.setItem(getKey('NEON_MAX_ALTITUDE'), alt.toString());
    },

    loadCoins: (): number => {
        const s = localStorage.getItem(getKey('NEON_TOTAL_COINS'));
        return s ? (parseInt(s, 10) || 0) : 0;
    },

    saveCoins: (coins: number) => {
        localStorage.setItem(getKey('NEON_TOTAL_COINS'), coins.toString());
    },

    loadUpgrades: (): Partial<ShopUpgrades> => {
        try {
            const s = localStorage.getItem(getKey('NEON_UPGRADES'));
            if (s) return JSON.parse(s);
        } catch (e) { }
        return {};
    },

    saveUpgrades: (upgrades: ShopUpgrades) => {
        localStorage.setItem(getKey('NEON_UPGRADES'), JSON.stringify(upgrades));
    },

    loadControlMode: (): 'BUTTONS' | 'TILT' | 'ARROWS' | 'JOYSTICK' | null => {
        return localStorage.getItem(getKey('NEON_CONTROL_MODE')) as 'BUTTONS' | 'TILT' | 'ARROWS' | 'JOYSTICK' | null;
    },

    saveControlMode: (mode: 'BUTTONS' | 'TILT' | 'ARROWS' | 'JOYSTICK') => {
        localStorage.setItem(getKey('NEON_CONTROL_MODE'), mode);
    },

    loadCalibration: () => {
        try {
            const s = localStorage.getItem(getKey('NEON_CALIBRATION'));
            if (s) return JSON.parse(s);
        } catch (e) { }
        return null;
    },

    saveCalibration: (data: any) => {
        localStorage.setItem(getKey('NEON_CALIBRATION'), JSON.stringify(data));
    },

    loadStats: (): PlayerStats => {
        try {
            const s = localStorage.getItem(getKey('NEON_STATS'));
            if (s) return JSON.parse(s);
        } catch (e) { }
        return {
            gamesPlayed: 0,
            totalCoinsCollected: 0,
            totalJetpackTime: 0,
            totalPerfectJumps: 0,
            maxCombo: 0,
            noDamageDistance: 0,
            fastest1500m: 0
        };
    },

    saveStats: (stats: PlayerStats) => {
        localStorage.setItem(getKey('NEON_STATS'), JSON.stringify(stats));
    },

    updateStats: (newStats: Partial<PlayerStats>) => {
        const current = Persistence.loadStats();
        const updated = {
            gamesPlayed: current.gamesPlayed + (newStats.gamesPlayed || 0),
            totalCoinsCollected: current.totalCoinsCollected + (newStats.totalCoinsCollected || 0),
            totalJetpackTime: current.totalJetpackTime + (newStats.totalJetpackTime || 0),
            totalPerfectJumps: current.totalPerfectJumps + (newStats.totalPerfectJumps || 0),
            maxCombo: Math.max(current.maxCombo, newStats.maxCombo || 0),
            noDamageDistance: Math.max(current.noDamageDistance, newStats.noDamageDistance || 0),
            fastest1500m: (current.fastest1500m === 0 || (newStats.fastest1500m || 0) < current.fastest1500m) && (newStats.fastest1500m || 0) > 0
                ? (newStats.fastest1500m || 0)
                : current.fastest1500m
        };
        Persistence.saveStats(updated);
    },

    fetchGlobalLeaderboard: async (): Promise<LeaderboardEntry[]> => {
        try {
            // Timeout de 5 segundos
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const res = await fetch('/api/leaderboard', { signal: controller.signal });
            clearTimeout(timeout);

            if (!res.ok) throw new Error('API Error');
            const data = await res.json();

            // Handle new API format { success: true, leaderboard: [...] }
            const entries = data.leaderboard || data;

            if (!Array.isArray(entries)) {
                throw new Error('Invalid response format');
            }

            // Map API format to LeaderboardEntry
            return entries.map((item: any, index: number) => ({
                id: item.id || `global-${index}`,
                name: item.name || '???',
                score: typeof item.score === 'number' ? item.score : parseInt(item.score) || 0,
                date: item.date || null
            }));
        } catch (e) {
            console.warn("Global leaderboard fetch failed, using local.", e);
            // Retorna placeholder se não tem local
            const local = Persistence.loadLeaderboard();
            if (local.length === 0) {
                return [
                    { id: '1', name: '???', score: 0, date: '' },
                    { id: '2', name: '???', score: 0, date: '' },
                    { id: '3', name: '???', score: 0, date: '' },
                ];
            }
            return local;
        }
    },

    submitGlobalScore: async (name: string, score: number, skinId?: string): Promise<{ success: boolean; rank?: number; error?: string; offline?: boolean }> => {
        // Sempre salva localmente primeiro
        Persistence.saveScoreToLeaderboard(name, score, skinId);

        try {
            // Timeout de 5 segundos
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const res = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score: Math.floor(Number(score)), skinId }),
                signal: controller.signal
            });
            clearTimeout(timeout);

            const data = await res.json();

            // Mesmo se offline=true, consideramos sucesso
            if (data.success) {
                return {
                    success: true,
                    rank: data.rank,
                    offline: data.offline || false
                };
            }

            throw new Error(data.error || 'Failed to submit');
        } catch (e) {
            console.error("Failed to submit global score", e);
            return { success: true, offline: true, error: 'Salvo localmente' };
        }
    },

    loadLeaderboard: (): LeaderboardEntry[] => {
        try {
            const s = localStorage.getItem(getKey('NEON_LEADERBOARD'));
            if (s) return JSON.parse(s);
        } catch (e) { }
        return [];
    },

    saveLeaderboard: (board: LeaderboardEntry[]) => {
        localStorage.setItem(getKey('NEON_LEADERBOARD'), JSON.stringify(board));
    },

    saveScoreToLeaderboard: (name: string, score: number, skinId?: string) => {
        const leaderboard = Persistence.loadLeaderboard();
        leaderboard.push({ id: Date.now().toString(), name, score, date: new Date().toISOString(), skinId });
        leaderboard.sort((a, b) => b.score - a.score);
        const top10 = leaderboard.slice(0, 10);
        Persistence.saveLeaderboard(top10);
        return top10;
    },

    loadTestLevel: () => {
        try {
            const s = localStorage.getItem(getKey('NEON_TEST_LEVEL'));
            if (s) return JSON.parse(s);
        } catch (e) { }
        return null;
    },

    saveTestLevel: (data: any) => {
        localStorage.setItem(getKey('NEON_TEST_LEVEL'), JSON.stringify(data));
    },

    loadUnlockedSkins: (): string[] => {
        try {
            const s = localStorage.getItem(getKey('UNLOCKED_CHARACTERS'));
            if (s) return JSON.parse(s);
        } catch (e) { }
        return [];
    },

    saveUnlockedSkins: (skins: string[]) => {
        localStorage.setItem(getKey('UNLOCKED_CHARACTERS'), JSON.stringify(skins));
    },

    loadTrophySkins: () => {
        try {
            const s = localStorage.getItem(getKey('TROPHY_SKINS'));
            if (s) return JSON.parse(s);
        } catch (e) { }
        return {};
    },

    saveTrophySkins: (data: any) => {
        localStorage.setItem(getKey('TROPHY_SKINS'), JSON.stringify(data));
    },

    loadSeenSkins: (): string[] => {
        try {
            const s = localStorage.getItem(getKey('NEON_SEEN_SKINS'));
            if (s) return JSON.parse(s);
        } catch (e) { }
        return [];
    },

    saveSeenSkins: (skins: string[]) => {
        localStorage.setItem(getKey('NEON_SEEN_SKINS'), JSON.stringify(skins));
    },

    loadControlLayout: () => {
        try {
            const s = localStorage.getItem(getKey('NEON_CONTROL_LAYOUT'));
            if (s) return JSON.parse(s);
        } catch (e) { }
        return null;
    },

    saveControlLayout: (layout: any) => {
        localStorage.setItem(getKey('NEON_CONTROL_LAYOUT'), JSON.stringify(layout));
    },

    // Pet System Persistence
    loadPetState: (): any | null => {
        try {
            const s = localStorage.getItem(getKey('NEON_PET_STATE'));
            if (s) return JSON.parse(s);
        } catch (e) {
            console.error('Pet state load error:', e);
        }
        return null;
    },

    savePetState: (pet: any) => {
        try {
            localStorage.setItem(getKey('NEON_PET_STATE'), JSON.stringify(pet));
        } catch (e) {
            console.error('Pet state save error:', e);
        }
    },

    isPetEnabled: (): boolean => {
        return true; // Pet system always enabled
    },

    setPetEnabled: (enabled: boolean) => {
        // Keep function for compatibility but does nothing
        // Pet system is now always enabled
    },
};
