import React from 'react';
import { Maximize } from 'lucide-react';

interface FullscreenModalProps {
    onClose: () => void;
    lang: string;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({ onClose, lang }) => {
    const requestFullscreen = async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if ((elem as any).webkitRequestFullscreen) {
                await (elem as any).webkitRequestFullscreen();
            } else if ((elem as any).mozRequestFullScreen) {
                await (elem as any).mozRequestFullScreen();
            } else if ((elem as any).msRequestFullscreen) {
                await (elem as any).msRequestFullscreen();
            }
        } catch (e) {
            console.error("Fullscreen request failed:", e);
        }
        localStorage.setItem('HAS_SEEN_FULLSCREEN', 'true');
        onClose();
    };

    const handleSkip = () => {
        localStorage.setItem('HAS_SEEN_FULLSCREEN', 'true');
        onClose();
    };

    const messages = {
        PT: {
            title: "MODO TELA CHEIA",
            subtitle: "Pra uma experiência muito mais massa",
            message: "Bora ativar tela cheia? Se é pra desafiar a gravidade, vamo fazer direito brother!",
            accept: "BORA LÁ!",
            decline: "Depois eu vejo"
        },
        EN: {
            title: "IMMERSIVE EXPERIENCE",
            subtitle: "For a truly transcendental experience",
            message: "I suggest activating fullscreen mode. After all, if we're going to defy gravity, let's do it with style.",
            accept: "YES, WITH CLASS",
            decline: "Maybe later"
        }
    };

    const t = messages[lang as keyof typeof messages] || messages.EN;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-cyan-500/50 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.4)] animate-in zoom-in duration-500">

                {/* Header */}
                <div className="p-6 text-center border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/50 to-blue-950/50">
                    <div className="w-20 h-20 mx-auto mb-4 bg-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <Maximize size={40} className="text-cyan-400" />
                    </div>
                    <h2 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter">
                        {t.title}
                    </h2>
                    <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">
                        {t.subtitle}
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    {/* PP Dedication Banner */}
                    <div className="mb-6 p-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-xl">
                        <p className="text-yellow-400 text-sm font-black uppercase tracking-widest">🏆 v3.3.4 🏆</p>
                        <p className="text-yellow-300 text-base font-bold mt-1">PARABÉNS BROTHER PP</p>
                        <p className="text-yellow-200/70 text-xs italic">Bruno Perrone Edition</p>
                    </div>

                    <p className="text-slate-300 text-base leading-relaxed italic mb-8">
                        "{t.message}"
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={requestFullscreen}
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-lg rounded-xl uppercase tracking-widest shadow-lg shadow-cyan-900/50 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                        >
                            <Maximize size={20} />
                            {t.accept}
                        </button>
                        <button
                            onClick={handleSkip}
                            className="w-full py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white font-bold text-sm rounded-xl uppercase tracking-wider transition-all"
                        >
                            {t.decline}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-950/50 border-t border-slate-800 text-center">
                    <p className="text-slate-600 text-[10px] italic">
                        * Você pode sair do fullscreen pressionando ESC
                    </p>
                </div>
            </div>
        </div>
    );
};
