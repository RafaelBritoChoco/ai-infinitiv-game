import React, { useEffect, useState } from 'react';
import { RotateCcw, Home, Coins, Trophy, Globe, Loader2, Check, X } from 'lucide-react';
import { FireworksCelebration } from './FireworksCelebration';
import { UnlockNotification } from './UnlockNotification';
import { soundManager } from '../audioManager';
import { Persistence } from '../persistence';
import { CharacterChallenge, CHARACTER_CHALLENGES } from '../../../types';

// Helper function to check challenge completion and save unlock
const checkAndUnlockCharacters = (gameData: {
    score: number;
    maxCombo: number;
    runCoins: number;
    totalCoins: number; // Wallet or Total Collected? Challenge says "Total Collected" for Acre.
    jetpackTime: number;
    perfectJumps: number;
    noDamageAltitude: number;
    gameTime: number;
    globalRank?: number;
    totalGames: number;
    totalCoinsCollected: number; // Cumulative
}): CharacterChallenge[] => {
    const unlocked: CharacterChallenge[] = [];
    
    // Load existing unlocks
    let unlockedChars = Persistence.loadUnlockedSkins();
    
    // Check each challenge
    for (const challenge of CHARACTER_CHALLENGES) {
        // Skip already unlocked
        if (unlockedChars.includes(challenge.skinId)) continue;
        
        let completed = false;
        
        switch (challenge.requirement) {
            case 'world_record':
                completed = gameData.globalRank === 1;
                break;
            case 'altitude':
                completed = gameData.score >= challenge.targetValue;
                break;
            case 'coins':
                // Check both run coins and total coins depending on target
                // Singer: 500 in one run. Acre: 1000 total.
                if (challenge.targetValue === 500) completed = gameData.runCoins >= challenge.targetValue;
                else if (challenge.targetValue === 1000) completed = gameData.totalCoinsCollected >= challenge.targetValue;
                else completed = gameData.runCoins >= challenge.targetValue;
                break;
            case 'games':
                completed = gameData.totalGames >= challenge.targetValue;
                break;
            case 'combo':
                completed = gameData.maxCombo >= challenge.targetValue;
                break;
            case 'no_damage':
                completed = gameData.noDamageAltitude >= challenge.targetValue;
                break;
            case 'jetpack':
                // Dusty: 30s in one run
                completed = gameData.jetpackTime >= challenge.targetValue;
                break;
            case 'perfect_jumps':
                // Joker: 50 in one run
                completed = gameData.perfectJumps >= challenge.targetValue;
                break;
            case 'speed':
                // Speed challenge: reach altitude in time (seconds)
                completed = gameData.score >= challenge.targetValue && gameData.gameTime <= 180;
                break;
        }
        
        if (completed) {
            unlocked.push(challenge);
            unlockedChars.push(challenge.skinId);
        }
    }
    
    // Save newly unlocked
    if (unlocked.length > 0) {
        Persistence.saveUnlockedSkins(unlockedChars);
    }
    
    return unlocked;
};

export const GameOverMenu = ({ gameState, handleStart, setGameState, leaderboard, onSaveScore, selectedIndex }: any) => {
    const [playerName, setPlayerName] = useState(() => {
        // Auto-fill from login profile if available
        const profile = Persistence.getProfile();
        return profile || localStorage.getItem('PLAYER_NAME') || '';
    });
    const [submitted, setSubmitted] = useState(false);
    const [submittedRank, setSubmittedRank] = useState<number | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [bonusGiven, setBonusGiven] = useState(false);
    const [newUnlocks, setNewUnlocks] = useState<CharacterChallenge[]>([]);
    const [currentUnlockIndex, setCurrentUnlockIndex] = useState(0);
    
    // Funny message state
    const [failureMessage, setFailureMessage] = useState('');

    const isNewHighScore = gameState.score > gameState.highScore;
    const currentScore = Math.floor(gameState.score); // Ensure integer
    const isTooLow = currentScore < 500;

    // Generate funny message on mount if score is low
    useEffect(() => {
        if (isTooLow) {
            const msgs = [
                "Nem saiu do chão direito... 🐛",
                "Isso foi um pulo ou um tropeço? 🗿",
                "A gravidade te ama demais. ❤️",
                "500m é o mínimo pra ser gente. 📉",
                "Tenta ligar o monitor na próxima. 📺",
                "Minha avó sobe mais alto. 👵",
                "Deu lag no cérebro? 🧠",
                "Aperta espaço pra pular, tá? ⌨️",
                "Altitude de formiga. 🐜",
                "O chão é lava... ah não, você morreu nele. 🔥",
                "Houston, temos um problema: você. 🚀",
                "Foi mal, tava olhando o zap? 📱",
                "Melhor voltar pro tutorial. 📚",
                "Gravidade: 1, Você: 0. 🍎",
                "Tanto upgrade de pulo pra isso? 🦘",
                "Tem jetpack e morre assim? Vergonha. ⛽",
                
                // Add more humorous messages here
            ];
            setFailureMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        }
    }, [isTooLow]);
    
    // Increment total games count on mount
    useEffect(() => {
        Persistence.updateStats({
            gamesPlayed: 1,
            totalCoinsCollected: gameState.runCoins || 0,
            totalJetpackTime: gameState.jetpackTime || 0,
            totalPerfectJumps: gameState.perfectJumps || 0,
            maxCombo: gameState.maxCombo || 0,
            noDamageDistance: gameState.noDamageAltitude || 0,
            fastest1500m: (gameState.score >= 1500 && gameState.gameTime) ? gameState.gameTime : 0
        });
    }, []);

    // Check for character unlocks on game over
    useEffect(() => {
        const stats = Persistence.loadStats();
        
        const unlocked = checkAndUnlockCharacters({
            score: currentScore,
            maxCombo: gameState.maxCombo || 0,
            runCoins: gameState.runCoins || 0,
            totalCoins: gameState.totalCoins || 0,
            jetpackTime: gameState.jetpackTime || 0,
            perfectJumps: gameState.perfectJumps || 0,
            noDamageAltitude: gameState.noDamageAltitude || 0,
            gameTime: gameState.gameTime || 0,
            globalRank: submittedRank || undefined,
            totalGames: stats.gamesPlayed,
            totalCoinsCollected: stats.totalCoinsCollected
        });
        
        if (unlocked.length > 0) {
            setNewUnlocks(unlocked);
        }
    }, [currentScore, gameState, submittedRank]);

    // Handle Top 3 celebration and rewards - DIFFERENT rewards per rank
    useEffect(() => {
        if (submittedRank && submittedRank <= 3 && !bonusGiven) {
            setShowCelebration(true);
            setBonusGiven(true);
            
            // Hide celebration after 2 seconds (was staying forever)
            setTimeout(() => setShowCelebration(false), 2000);
            
            // Different gold bonus per rank: 1st=300, 2nd=200, 3rd=100
            const goldBonus = submittedRank === 1 ? 300 : submittedRank === 2 ? 200 : 100;
            const currentCoins = gameState.totalCoins || 0;
            setGameState((prev: any) => ({ ...prev, totalCoins: currentCoins + goldBonus }));
            Persistence.saveCoins(currentCoins + goldBonus);
            
            // Save trophy skin unlock (3 games) - DIFFERENT skin per rank
            try {
                const existingData = Persistence.loadTrophySkins();
                if (submittedRank === 1) existingData.gold = (existingData.gold || 0) + 3;
                if (submittedRank === 2) existingData.silver = (existingData.silver || 0) + 3;
                if (submittedRank === 3) existingData.bronze = (existingData.bronze || 0) + 3;
                Persistence.saveTrophySkins(existingData);
            } catch {}
            
            // Play celebration sound
            soundManager.playPerfectJump();
            setTimeout(() => soundManager.playPerfectJump(), 300);
            setTimeout(() => soundManager.playPerfectJump(), 600);
        }
    }, [submittedRank, bonusGiven, gameState.totalCoins, setGameState]);


    const handleSubmitScore = async () => {
        const trimmedName = playerName.trim();
        
        if (!trimmedName || trimmedName.length < 2) {
            alert('Digite um nome com pelo menos 2 caracteres!');
            return;
        }
        if (trimmedName.length > 15) {
            alert('Nome muito longo! Máximo 15 caracteres.');
            return;
        }
        
        // INSTANT: Save locally and show success immediately
        localStorage.setItem('PLAYER_NAME', trimmedName);
        Persistence.saveScoreToLeaderboard(trimmedName, currentScore);
        setSubmitted(true);
        soundManager.playPerfectJump();
        
        // Background: Try to save online (don't wait)
        fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: trimmedName, score: currentScore })
        })
        .then(res => res.json())
        .then(data => {
            if (data.rank) {
                setSubmittedRank(data.rank);
            }
        })
        .catch(() => {}); // Ignore errors, already saved locally
    };

    const menuOptions = [
        { label: 'RETRY MISSION', action: () => handleStart(gameState.gameMode), icon: RotateCcw, color: 'cyan' },
        { label: 'MAIN MENU', action: () => setGameState((p: any) => ({ ...p, isGameOver: false, isPlaying: false })), icon: Home, color: 'slate' }
    ];

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'from-yellow-500 to-amber-600 text-yellow-200';
        if (rank === 2) return 'from-slate-300 to-slate-500 text-slate-100';
        if (rank === 3) return 'from-amber-600 to-orange-700 text-amber-200';
        return 'from-cyan-600 to-cyan-800 text-cyan-200';
    };

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            {/* Fireworks for Top 3 */}
            {showCelebration && submittedRank && submittedRank <= 3 && (
                <FireworksCelebration rank={submittedRank} />
            )}
            
            <div className="bg-[#020617] border border-red-900/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-md w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 relative z-10">
                <div className="text-center">
                    <div className="text-red-500 text-sm font-bold tracking-[0.5em] uppercase mb-2">Signal Lost</div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">GAME OVER</h2>
                </div>

                {/* Score Display */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl text-center">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Altitude</div>
                        <div className="text-2xl font-black text-white">{currentScore}m</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl text-center">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Coins</div>
                        <div className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1"><Coins size={16} /> {gameState.runCoins}</div>
                    </div>
                </div>

                {/* New High Score Badge */}
                {isNewHighScore && (
                    <div className="w-full bg-gradient-to-r from-yellow-900/30 to-yellow-600/30 border border-yellow-500/50 p-3 rounded-xl text-center animate-pulse">
                        <div className="flex items-center justify-center gap-2 text-yellow-400 font-black uppercase tracking-widest">
                            <Trophy size={20} /> NOVO RECORDE!
                        </div>
                    </div>
                )}

                {/* TOP 3 CELEBRATION - Quick trophy flash */}
                {showCelebration && submittedRank && submittedRank <= 3 && (
                    <div className="flex items-center justify-center gap-3 animate-bounce" style={{ animationDuration: '0.5s' }}>
                        <span className="text-4xl">
                            {submittedRank === 1 ? '🏆' : submittedRank === 2 ? '🥈' : '🥉'}
                        </span>
                        <span className={`text-2xl font-black ${submittedRank === 1 ? 'text-yellow-400' : submittedRank === 2 ? 'text-slate-300' : 'text-amber-500'}`}>
                            TOP {submittedRank}!
                        </span>
                    </div>
                )}

                {/* Submit Score Section - ONLY IF > 500m */}
                {!submitted ? (
                    isTooLow ? (
                        <div className="w-full bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-center space-y-2 animate-in slide-in-from-bottom-2">
                            <div className="text-red-400 font-black uppercase tracking-widest text-xs mb-1">
                                🚫 SCORE MUITO BAIXO
                            </div>
                            <p className="text-white font-bold text-lg italic">
                                "{failureMessage}"
                            </p>
                            <p className="text-slate-500 text-[10px] mt-2">
                                Mínimo para Ranking: <span className="text-yellow-500 font-bold">500m</span>
                            </p>
                        </div>
                    ) : (
                        <div className="w-full bg-slate-900/50 border border-cyan-900/50 p-4 rounded-xl space-y-3">
                            <div className="text-center">
                                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
                                    <Globe size={14} className="inline mr-1" /> Salvar no Ranking Global
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="SEU NOME"
                                    maxLength={15}
                                    disabled={!!Persistence.getProfile()} // Disable if logged in
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-3 text-white font-bold text-center uppercase focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    onClick={handleSubmitScore}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold transition-all uppercase tracking-widest shadow-lg shadow-cyan-900/20"
                                >
                                    SALVAR RECORD
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    <div className={`w-full p-4 rounded-xl text-center animate-in zoom-in bg-gradient-to-r ${submittedRank ? getRankColor(submittedRank) : 'from-green-900/50 to-emerald-900/50 border border-green-500/30'}`}>
                        <div className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                            <Check size={14} /> SCORE SALVO!
                        </div>
                        {submittedRank && (
                            <div className="text-2xl font-black">
                                RANK #{submittedRank}
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    {menuOptions.map((opt, i) => (
                        <button
                            key={i}
                            onClick={opt.action}
                            className={`py-4 rounded-xl font-black text-sm uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${
                                opt.color === 'cyan' 
                                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20' 
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            }`}
                        >
                            <opt.icon size={20} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Unlock Notifications */}
            {newUnlocks.length > 0 && currentUnlockIndex < newUnlocks.length && (
                <UnlockNotification 
                    challenge={newUnlocks[currentUnlockIndex]} 
                    onClose={() => setCurrentUnlockIndex(prev => prev + 1)} 
                />
            )}
        </div>
    );
};
