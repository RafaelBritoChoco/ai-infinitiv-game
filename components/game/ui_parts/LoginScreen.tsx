/**
 * Login & Register Screen
 * Supports: Login, Sign Up, Guest Mode
 * Includes LOCAL MOCK for development without backend
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, Loader2, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (token: string, username: string, isGuest: boolean, isAdmin?: boolean, preferences?: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSuccess = (data: any) => {
        sessionStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('is_guest', 'false');

        if (data.isAdmin) {
            sessionStorage.setItem('is_admin', 'true');
            if (data.preferences) {
                sessionStorage.setItem('admin_prefs', JSON.stringify(data.preferences));
            }
        }

        onLogin(data.token, data.username, false, data.isAdmin, data.preferences);
    };

    const handleGuestSuccess = (data: any) => {
        sessionStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('is_guest', 'true');
        onLogin(data.token, data.username, true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (mode === 'REGISTER' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Tenta conectar na API (vai falhar localmente no Vite padrão)
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: mode === 'LOGIN' ? 'login' : 'register',
                    username,
                    password
                })
            });

            // Se a API retornar 404 (não encontrada localmente), usa o MOCK LOCAL
            if (response.status === 404) {
                console.warn('⚠️ API não encontrada. Usando MOCK LOCAL para desenvolvimento.');
                throw new Error('API_NOT_FOUND');
            }

            const data = await response.json();

            if (data.success) {
                handleSuccess(data);
            } else {
                setError(data.message || 'Authentication failed');
            }
        } catch (err: any) {
            // FALLBACK PARA DESENVOLVIMENTO LOCAL
            if (err.message === 'API_NOT_FOUND' || err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
                console.log('🔧 MODO DEV: Simulando login local...');

                // Simulação de validação local
                if (mode === 'LOGIN') {
                    if (username === 'choco' && password === 'senha pro') {
                        handleSuccess({
                            token: 'dev_token_admin',
                            username: 'choco',
                            isAdmin: true,
                            preferences: { infiniteMoney: false, unlockAll: true }
                        });
                        return;
                    }
                    // Outros usuários (simulado)
                    handleSuccess({
                        token: `dev_token_${Date.now()}`,
                        username: username,
                        isAdmin: false
                    });
                    return;
                }

                // Simulação de registro local
                if (mode === 'REGISTER') {
                    handleSuccess({
                        token: `dev_token_${Date.now()}`,
                        username: username,
                        isAdmin: false
                    });
                    return;
                }
            }

            console.error('Login error:', err);
            setError('Erro de conexão. Se estiver local, tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'guest' })
            });

            if (response.status === 404) throw new Error('API_NOT_FOUND');

            const data = await response.json();
            if (data.success) handleGuestSuccess(data);

        } catch (err) {
            // FALLBACK GUEST LOCAL
            console.log('🔧 MODO DEV: Simulando Guest local...');
            handleGuestSuccess({
                token: `guest_dev_${Date.now()}`,
                username: `Guest_${Math.floor(Math.random() * 999)}`,
                isGuest: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-[9999]">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#1e1b4b_0%,_#000000_100%)]"></div>
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-900/40 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-900/40 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black italic tracking-tighter text-white mb-2">
                        AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">INFINITIV</span>
                    </h1>
                    <p className="text-slate-500 text-xs tracking-widest uppercase font-bold">
                        {mode === 'LOGIN' ? 'Login to your account' : 'Create new account'}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs text-center font-bold">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-sm"
                            placeholder="Username"
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-sm"
                            placeholder="Password"
                            required
                        />
                    </div>

                    {mode === 'REGISTER' && (
                        <div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-sm"
                                placeholder="Confirm Password"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <span>{mode === 'LOGIN' ? 'ENTER GAME' : 'CREATE ACCOUNT'}</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                            setError('');
                            setPassword('');
                            setConfirmPassword('');
                        }}
                        className="text-slate-400 hover:text-white text-xs font-bold transition-colors"
                    >
                        {mode === 'LOGIN'
                            ? "Don't have an account? Sign Up"
                            : "Already have an account? Login"}
                    </button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-4 bg-slate-900 text-slate-600 text-[10px] uppercase font-bold">OR</span>
                    </div>
                </div>

                {/* Guest Button */}
                <button
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                    <UserPlus size={16} />
                    Play as Guest
                </button>
            </div>
        </div>
    );
};
