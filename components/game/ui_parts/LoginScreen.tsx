import React, { useState } from 'react';
import { Persistence } from '../persistence';
import { User, Lock, Trash2, LogIn, UserPlus, Ghost } from 'lucide-react';

export const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim()) {
            setError('Username is required');
            return;
        }
        setIsLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            Persistence.setProfile(username.trim());
            setIsLoading(false);
            onLogin();
        }, 800);
    };

    const handleRegister = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Username and password required');
            return;
        }
        setIsLoading(true);

        // Simulate Database Registration
        // In a real app: await fetch('/api/register', { method: 'POST', body: ... })
        setTimeout(() => {
            Persistence.setProfile(username.trim());
            setIsLoading(false);
            onLogin();
        }, 1500);
    };

    const handleGuest = () => {
        // Guest mode: Use a temporary session ID so nothing persists after reload/session
        const guestId = `guest_${Date.now()}`;
        Persistence.setProfile(guestId);
        onLogin();
    };

    const handleReset = () => {
        if (!username.trim()) {
            setError('Enter username to reset');
            return;
        }
        if (confirm(`Are you sure you want to delete all progress for ${username}?`)) {
            Persistence.setProfile(username.trim());
            Persistence.resetProfile();
            alert('Progress reset successfully');
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-[#020617] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl relative overflow-hidden">
                
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                
                <h2 className="text-3xl font-black text-white text-center mb-2 tracking-tighter italic">
                    <span className="text-cyan-400">NEON</span> {mode === 'LOGIN' ? 'LOGIN' : 'REGISTER'}
                </h2>
                <p className="text-slate-400 text-center text-xs mb-8 uppercase tracking-widest">
                    {mode === 'LOGIN' ? 'Welcome back, Pilot' : 'Join the ranks'}
                </p>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input 
                                type="text" 
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-all"
                                placeholder="Enter username"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-all"
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    {mode === 'REGISTER' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-2 items-start">
                            <span className="text-yellow-500 text-lg">⚠️</span>
                            <p className="text-yellow-200/80 text-xs leading-tight">
                                <strong>Atenção:</strong> Não coloque informações confidenciais ou senhas reais. Este é um ambiente de jogo.
                            </p>
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm font-bold text-center animate-pulse">{error}</p>}

                    {mode === 'LOGIN' ? (
                        <>
                            <button 
                                onClick={handleLogin}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-2 disabled:opacity-50"
                            >
                                {isLoading ? 'Loading...' : <><LogIn size={20} /> Login</>}
                            </button>

                            <button 
                                onClick={() => { setMode('REGISTER'); setError(''); }}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold py-3 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest mt-2"
                            >
                                <UserPlus size={16} /> Create Account
                            </button>

                            <div className="relative py-2 flex items-center justify-center mt-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-800"></div>
                                </div>
                                <span className="relative bg-slate-900 px-2 text-xs text-slate-500 uppercase">OR</span>
                            </div>

                            <button 
                                onClick={handleGuest}
                                className="w-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 font-bold py-3 rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                            >
                                <Ghost size={16} /> Play as Guest
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={handleRegister}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-2 disabled:opacity-50"
                            >
                                {isLoading ? 'Creating...' : <><UserPlus size={20} /> Create & Play</>}
                            </button>
                            
                            <button 
                                onClick={() => { setMode('LOGIN'); setError(''); }}
                                className="w-full text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest py-2"
                            >
                                Back to Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
