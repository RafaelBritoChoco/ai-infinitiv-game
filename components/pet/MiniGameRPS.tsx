import React, { useState, useEffect } from 'react';
import { X, Trophy, RefreshCw } from 'lucide-react';
import { performPetAction } from './pet-service';
import { PetState } from '../../pet-types';

interface MiniGameRPSProps {
    onClose: () => void;
    onGameEnd: () => void;
}

type Choice = 'rock' | 'paper' | 'scissors';

const CHOICES: { id: Choice; icon: string; beats: Choice }[] = [
    { id: 'rock', icon: '🪨', beats: 'scissors' },
    { id: 'paper', icon: '📄', beats: 'rock' },
    { id: 'scissors', icon: '✂️', beats: 'paper' }
];

export const MiniGameRPS: React.FC<MiniGameRPSProps> = ({ onClose, onGameEnd }) => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'result'>('start');
    const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
    const [petChoice, setPetChoice] = useState<Choice | null>(null);
    const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
    const [countdown, setCountdown] = useState(3);

    const handleChoice = (choice: Choice) => {
        setPlayerChoice(choice);
        setGameState('playing');
        setCountdown(3);
    };

    useEffect(() => {
        if (gameState === 'playing') {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(prev => prev - 1), 600);
                return () => clearTimeout(timer);
            } else {
                // Pet makes a choice
                const randomChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)].id;
                setPetChoice(randomChoice);
                determineWinner(playerChoice!, randomChoice);
            }
        }
    }, [gameState, countdown, playerChoice]);

    const determineWinner = async (player: Choice, pet: Choice) => {
        if (player === pet) {
            setResult('draw');
        } else if (CHOICES.find(c => c.id === player)?.beats === pet) {
            setResult('win');
            // Award happiness
            await performPetAction('play', { funPower: 40 });
        } else {
            setResult('lose');
            // Still award a little fun for playing
            await performPetAction('play', { funPower: 10 });
        }
        setGameState('result');
        onGameEnd();
    };

    const resetGame = () => {
        setPlayerChoice(null);
        setPetChoice(null);
        setResult(null);
        setGameState('start');
    };

    return (
        <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border-4 border-purple-600 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center relative min-h-[400px]">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="w-full bg-purple-900/30 p-4 text-center border-b border-purple-800">
                    <h2 className="text-2xl font-black text-purple-400 uppercase tracking-widest">Jokenpô</h2>
                </div>

                {/* Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center w-full p-8 gap-8">

                    {/* PET AREA */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-xs font-bold text-purple-300 uppercase tracking-widest">Pet</div>
                        <div className={`w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center text-5xl border-2 border-slate-700 transition-all ${gameState === 'playing' ? 'animate-bounce' : ''}`}>
                            {gameState === 'start' ? '❓' :
                                gameState === 'playing' ? '✊' :
                                    CHOICES.find(c => c.id === petChoice)?.icon}
                        </div>
                    </div>

                    {/* VS / RESULT */}
                    <div className="h-16 flex items-center justify-center">
                        {gameState === 'playing' ? (
                            <div className="text-4xl font-black text-white animate-pulse">{countdown > 0 ? countdown : 'GO!'}</div>
                        ) : gameState === 'result' ? (
                            <div className={`text-3xl font-black uppercase ${result === 'win' ? 'text-green-400' :
                                result === 'lose' ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                {result === 'win' ? 'Você Venceu!' :
                                    result === 'lose' ? 'Você Perdeu!' : 'Empate!'}
                            </div>
                        ) : (
                            <div className="text-xl font-bold text-slate-500">VS</div>
                        )}
                    </div>

                    {/* PLAYER AREA */}
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Você</div>

                        {gameState === 'start' ? (
                            <div className="flex gap-4">
                                {CHOICES.map(choice => (
                                    <button
                                        key={choice.id}
                                        onClick={() => handleChoice(choice.id)}
                                        className="w-20 h-20 bg-slate-800 hover:bg-cyan-900/50 border-2 border-slate-700 hover:border-cyan-400 rounded-2xl flex items-center justify-center text-4xl transition-all hover:scale-110 active:scale-95"
                                    >
                                        {choice.icon}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-cyan-900/20 border-2 border-cyan-500 rounded-2xl flex items-center justify-center text-5xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                {CHOICES.find(c => c.id === playerChoice)?.icon}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                {gameState === 'result' && (
                    <div className="w-full p-6 bg-slate-950 border-t border-slate-800 flex justify-center">
                        <button
                            onClick={resetGame}
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all hover:scale-105"
                        >
                            <RefreshCw size={20} /> Jogar Novamente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
