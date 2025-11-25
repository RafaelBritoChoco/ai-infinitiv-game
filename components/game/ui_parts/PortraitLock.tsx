import React from 'react';
import { Smartphone } from 'lucide-react';

// DISABLED: User requested vertical mode support
export const PortraitLock = ({ locked }: { locked?: boolean }) => {
    if (!locked) return null;
    
    return (
        <div className="hidden fixed inset-0 z-[200] bg-black flex-col items-center justify-center text-white p-8 text-center">
            <Smartphone size={64} className="mb-4 animate-pulse text-cyan-400" />
            <h2 className="text-2xl font-bold mb-2">Please Rotate Device</h2>
            <p className="text-slate-400">This game is optimized for landscape mode.</p>
        </div>
    );
};
