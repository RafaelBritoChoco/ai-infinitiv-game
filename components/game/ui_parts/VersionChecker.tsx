/**
 * Version Check Component
 * Automatically detects new versions and forces update seamlessly
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

const CURRENT_VERSION = '2.0.0'; // Update this when deploying new version
const VERSION_CHECK_INTERVAL = 10000; // Check every 10 seconds

export const VersionChecker: React.FC = () => {
    const [status, setStatus] = useState<'IDLE' | 'UPDATING'>('IDLE');

    const performUpdate = async () => {
        // Prevent infinite loops: check if we just tried to update
        const lastUpdate = sessionStorage.getItem('last_update_attempt');
        if (lastUpdate && Date.now() - parseInt(lastUpdate) < 5000) {
            console.warn('⚠️ Update loop detected. Pausing update mechanism.');
            return;
        }

        setStatus('UPDATING');
        sessionStorage.setItem('last_update_attempt', Date.now().toString());

        try {
            console.log('🚀 AUTO-UPDATING GAME...');

            // 1. Clear Caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // 2. Unregister Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(reg => reg.unregister()));
            }

            // 3. Clear Storage (Optional - maybe keep user data?)
            // localStorage.clear(); // Keeping user data might be better?
            // sessionStorage.clear(); 
            // Let's clear only critical things or everything if requested
            // For now, let's keep it safe and clear everything to ensure fresh code
            localStorage.clear();
            sessionStorage.clear();

            // 4. Force Reload with Cache Busting
            console.log('✅ Ready to reload...');
            window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();

        } catch (error) {
            console.error('Update failed:', error);
            window.location.reload();
        }
    };

    const checkVersion = async () => {
        try {
            const response = await fetch(`/version.json?t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (response.ok) {
                const data = await response.json();
                const serverVersion = data.version;

                if (CURRENT_VERSION !== serverVersion) {
                    console.log(`🔄 New version found: ${serverVersion} (Current: ${CURRENT_VERSION})`);
                    performUpdate();
                }
            }
        } catch (error) {
            // Silent fail
        }
    };

    useEffect(() => {
        checkVersion();
        const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    if (status === 'IDLE') return null;

    // Full screen updating overlay
    return (
        <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center">
            <div className="text-center animate-pulse">
                <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-50 animate-ping"></div>
                    <RefreshCw size={64} className="text-cyan-400 animate-spin relative z-10" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">
                    UPDATING GAME
                </h2>
                <p className="text-cyan-500/70 text-xs font-mono mt-2">
                    INSTALLING VERSION {CURRENT_VERSION}...
                </p>
            </div>
        </div>
    );
};
