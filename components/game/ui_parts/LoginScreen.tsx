/**
 * Login Screen Component
 * Simple authentication with choco/senha pro
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (token: string, username: string, isGuest: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    username,
                    password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Save token to sessionStorage (not localStorage)
                sessionStorage.setItem('auth_token', data.token);
                sessionStorage.setItem('username', data.username);
                sessionStorage.setItem('is_guest', 'false');

                onLogin(data.token, data.username, false);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
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

            const data = await response.json();

            if (data.success) {
                // Save to sessionStorage (cleared on tab close)
                sessionStorage.setItem('auth_token', data.token);
                sessionStorage.setItem('username', data.username);
                sessionStorage.setItem('is_guest', 'true');

                onLogin(data.token, data.username, true);
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 z-[9999]">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ top: '10%', left: '20%' }}></div>
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ bottom: '10%', right: '20%', animationDelay: '1s' }}></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black italic tracking-tighter text-white mb-2">
                        AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">INFINITIV</span>
                    </h1>
                    <p className="text-cyan-500 font-mono text-xs tracking-[0.3em] uppercase">Vertical Ascent Protocol</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="Enter username"
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="Enter password"
                                disabled={loading}
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    <span>Login</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-900 text-slate-500">OR</span>
                        </div>
                    </div>

                    {/* Guest Button */}
                    <button
                        onClick={handleGuestLogin}
                        disabled={loading}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                        <UserPlus size={20} />
                        <span>Play as Guest</span>
                    </button>

                    <p className="mt-4 text-xs text-slate-500 text-center">
                        Guest mode: Progress will not be saved
                    </p>
                </div>

                {/* Hint */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600">
                        Tip: Use credentials provided by the admin
                    </p>
                </div>
            </div>
        </div>
    );
};
