/**
 * Version Check Component
 * Automatically detects new versions and forces update
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const CURRENT_VERSION = '2.0.0'; // Update this when deploying new version
const VERSION_CHECK_INTERVAL = 30000; // Check every 30 seconds

export const VersionChecker: React.FC = () => {
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const checkVersion = async () => {
        try {
            // Fetch version from server (timestamp based)
            const response = await fetch(`/version.json?t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (response.ok) {
                const data = await response.json();
                const serverVersion = data.version;

                console.log('🔍 Version check:', {
                    current: CURRENT_VERSION,
                    server: serverVersion,
                    needsUpdate: CURRENT_VERSION !== serverVersion
                });

                if (CURRENT_VERSION !== serverVersion) {
                    setNeedsUpdate(true);
                }
            }
        } catch (error) {
            console.warn('Version check failed:', error);
        }
    };

    // Check on mount
    useEffect(() => {
        checkVersion();

        // Check periodically
        const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    const handleForceUpdate = async () => {
        setIsChecking(true);

        try {
            console.log('🧹 CLEARING ALL BROWSER DATA FOR UPDATE...');

            // Clear everything
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(reg => reg.unregister()));
            }

            localStorage.clear();
            sessionStorage.clear();

            if ('indexedDB' in window) {
                const dbs = await indexedDB.databases();
                dbs.forEach(db => {
                    if (db.name) indexedDB.deleteDatabase(db.name);
                });
            }

            document.cookie.split(";").forEach(c => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            console.log('✅ ALL DATA CLEARED! Refreshing...');

            // Force reload
            window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
        } catch (error) {
            console.error('Update error:', error);
            window.location.reload();
        }
    };

    if (!needsUpdate) return null;

    // Blocking modal - user MUST update
    return (
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-red-950 to-orange-950 border-4 border-red-500 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse">
                {/* Warning Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <AlertTriangle size={80} className="text-red-500 animate-bounce" />
                        <div className="absolute inset-0 bg-red-500 blur-3xl opacity-50"></div>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-black text-white text-center mb-4">
                    NOVA VERSÃO DISPONÍVEL
                </h2>

                {/* Message */}
                <p className="text-red-200 text-center mb-6 leading-relaxed">
                    Uma atualização importante está disponível. Para continuar jogando, você precisa atualizar para a versão mais recente.
                </p>

                {/* Version Info */}
                <div className="bg-black/40 rounded-lg p-4 mb-6 border border-red-500/30">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-red-400">Versão Atual:</span>
                        <span className="text-white font-mono font-bold">{CURRENT_VERSION}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-green-400">Nova Versão:</span>
                        <span className="text-green-300 font-mono font-bold animate-pulse">Disponível</span>
                    </div>
                </div>

                {/* Update Button */}
                <button
                    onClick={handleForceUpdate}
                    disabled={isChecking}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg disabled:cursor-not-allowed"
                >
                    {isChecking ? (
                        <>
                            <RefreshCw size={24} className="animate-spin" />
                            <span>ATUALIZANDO...</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={24} />
                            <span>ATUALIZAR AGORA</span>
                        </>
                    )}
                </button>

                {/* Info */}
                <p className="text-xs text-red-300/70 text-center mt-4">
                    Todos os caches serão limpos automaticamente
                </p>
            </div>
        </div>
    );
};
