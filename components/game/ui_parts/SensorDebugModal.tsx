import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export const SensorDebugModal = ({ onClose }: { onClose: () => void }) => {
    const [orientation, setOrientation] = useState<any>({});
    const [absolute, setAbsolute] = useState<any>({});
    const [motion, setMotion] = useState<any>({});
    const [counts, setCounts] = useState({ orient: 0, abs: 0, motion: 0 });
    const [perms, setPerms] = useState<string>("Unknown");
    const [sensorStatus, setSensorStatus] = useState<'checking' | 'working' | 'blocked' | 'no-data'>('checking');
    const [isBrave, setIsBrave] = useState(false);

    useEffect(() => {
        // Detect Brave browser
        (navigator as any).brave?.isBrave().then((result: boolean) => setIsBrave(result)).catch(() => {});
        // Also check user agent
        if (navigator.userAgent.includes('Brave')) setIsBrave(true);

        let hasReceivedValidData = false;
        let checkTimeout: NodeJS.Timeout;

        const handleOrient = (e: DeviceOrientationEvent) => {
            setOrientation({ a: e.alpha, b: e.beta, g: e.gamma, abs: e.absolute });
            setCounts(p => ({ ...p, orient: p.orient + 1 }));
            
            // Check if we have REAL data (not null/undefined)
            if (e.gamma !== null && e.gamma !== undefined && e.beta !== null) {
                hasReceivedValidData = true;
                setSensorStatus('working');
            }
        };
        const handleAbs = (e: any) => {
            setAbsolute({ a: e.alpha, b: e.beta, g: e.gamma, abs: e.absolute });
            setCounts(p => ({ ...p, abs: p.abs + 1 }));
            
            if (e.gamma !== null && e.gamma !== undefined) {
                hasReceivedValidData = true;
                setSensorStatus('working');
            }
        };
        const handleMotion = (e: DeviceMotionEvent) => {
            setMotion({
                acc: e.acceleration,
                accG: e.accelerationIncludingGravity,
                rot: e.rotationRate
            });
            setCounts(p => ({ ...p, motion: p.motion + 1 }));
            
            if (e.accelerationIncludingGravity?.x !== null) {
                hasReceivedValidData = true;
                setSensorStatus('working');
            }
        };

        window.addEventListener('deviceorientation', handleOrient);
        window.addEventListener('deviceorientationabsolute', handleAbs);
        window.addEventListener('devicemotion', handleMotion);

        // After 3 seconds, check if we got valid data
        checkTimeout = setTimeout(() => {
            if (!hasReceivedValidData) {
                setSensorStatus('blocked');
            }
        }, 3000);

        return () => {
            window.removeEventListener('deviceorientation', handleOrient);
            window.removeEventListener('deviceorientationabsolute', handleAbs);
            window.removeEventListener('devicemotion', handleMotion);
            clearTimeout(checkTimeout);
        };
    }, []);

    const requestPerms = async () => {
        try {
            if ((DeviceOrientationEvent as any).requestPermission) {
                const r = await (DeviceOrientationEvent as any).requestPermission();
                setPerms(r);
                alert(`Permission: ${r}`);
            } else {
                setPerms("N/A (Android/Desktop)");
            }
        } catch (e: any) {
            setPerms(`Error: ${e.message}`);
        }
    };

    const isBraveDetected = isBrave || navigator.userAgent.includes('Brave');

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 text-white p-6 overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h2 className="text-xl font-bold text-cyan-400">SENSOR DIAGNOSTICS</h2>
                <button onClick={onClose} className="p-2 bg-red-900/50 text-red-200 rounded"><X size={20} /></button>
            </div>

            <div className="space-y-4">
                {/* STATUS ALERT */}
                {sensorStatus === 'blocked' && (
                    <div className="bg-red-900/50 border-2 border-red-500 p-4 rounded-lg animate-pulse">
                        <h3 className="font-bold text-red-400 text-lg mb-2">⚠️ SENSORS BLOCKED!</h3>
                        <p className="text-red-200 mb-3">Your browser is blocking motion sensors. Values are empty/null.</p>
                        
                        {isBraveDetected ? (
                            <div className="bg-orange-900/50 p-3 rounded border border-orange-500 mb-3">
                                <h4 className="font-bold text-orange-400 mb-2">🦁 BRAVE BROWSER DETECTED</h4>
                                <p className="text-orange-200 text-xs mb-2">Brave blocks sensors by default for privacy.</p>
                                <ol className="text-orange-100 text-xs space-y-1 list-decimal list-inside">
                                    <li>Tap the <strong>Brave Shield icon</strong> (lion) in address bar</li>
                                    <li>Turn OFF "Block Fingerprinting"</li>
                                    <li>Or use <strong>Chrome/Samsung Internet</strong> instead</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="bg-yellow-900/50 p-3 rounded border border-yellow-500">
                                <h4 className="font-bold text-yellow-400 mb-2">💡 Try these fixes:</h4>
                                <ol className="text-yellow-100 text-xs space-y-1 list-decimal list-inside">
                                    <li>Use <strong>Chrome</strong> or <strong>Samsung Internet</strong></li>
                                    <li>Check browser settings for "Motion Sensors"</li>
                                    <li>Reload the page after changing settings</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {sensorStatus === 'working' && (
                    <div className="bg-green-900/50 border-2 border-green-500 p-4 rounded-lg">
                        <h3 className="font-bold text-green-400 text-lg">✅ SENSORS WORKING!</h3>
                        <p className="text-green-200">Motion controls should work. Close this and play!</p>
                    </div>
                )}

                {sensorStatus === 'checking' && (
                    <div className="bg-blue-900/50 border-2 border-blue-500 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-400 text-lg flex items-center gap-2">
                            <Loader2 className="animate-spin" size={20} /> Checking sensors...
                        </h3>
                        <p className="text-blue-200">Tilt your device to test.</p>
                    </div>
                )}

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-yellow-400 mb-2">ENVIRONMENT</h3>
                    <div>Secure Context (HTTPS): <span className={window.isSecureContext ? "text-green-400" : "text-red-500"}>{window.isSecureContext ? "YES" : "NO"}</span></div>
                    <div>Browser: <span className={isBraveDetected ? "text-orange-400" : "text-slate-300"}>{isBraveDetected ? "Brave (may block sensors)" : "Chrome/Other"}</span></div>
                    <div>Permission State: {perms}</div>
                    <button onClick={requestPerms} className="mt-2 px-3 py-1 bg-blue-900 text-blue-200 rounded border border-blue-700">Request Permission</button>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-cyan-400 mb-2">DEVICE ORIENTATION (Standard)</h3>
                    <div>Events Fired: <span className={counts.orient > 5 ? "text-green-400" : "text-yellow-400"}>{counts.orient}</span></div>
                    <div>Alpha (Compass): <span className={orientation.a !== undefined && orientation.a !== null ? "text-green-400" : "text-red-400"}>{orientation.a?.toFixed(2) || "NULL ❌"}</span></div>
                    <div>Beta (Front/Back): <span className={orientation.b !== undefined && orientation.b !== null ? "text-green-400" : "text-red-400"}>{orientation.b?.toFixed(2) || "NULL ❌"}</span></div>
                    <div>Gamma (Left/Right): <span className={orientation.g !== undefined && orientation.g !== null ? "text-green-400" : "text-red-400"}>{orientation.g?.toFixed(2) || "NULL ❌"}</span></div>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-purple-400 mb-2">ORIENTATION ABSOLUTE (Android)</h3>
                    <div>Events Fired: {counts.abs}</div>
                    <div>Gamma: <span className={absolute.g !== undefined && absolute.g !== null ? "text-green-400" : "text-red-400"}>{absolute.g?.toFixed(2) || "NULL ❌"}</span></div>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-green-400 mb-2">DEVICE MOTION (Accel)</h3>
                    <div>Events Fired: {counts.motion}</div>
                    <div>AccG X: <span className={motion.accG?.x !== undefined && motion.accG?.x !== null ? "text-green-400" : "text-red-400"}>{motion.accG?.x?.toFixed(2) || "NULL ❌"}</span></div>
                </div>
            </div>
        </div>
    );
};
