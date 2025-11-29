import React, { useEffect, useState } from 'react';
import { ArrowUp, Zap, Rocket, CheckCircle2, AlertCircle, Trophy, ArrowLeftRight, Repeat, ArrowRight } from 'lucide-react';

interface TutorialOverlayProps {
    step: number;
    phase: 'INSTRUCTION' | 'PLAYING' | 'COMPLETED';
    lang: string;
    onComplete: () => void;
    onRestartSection: () => void;
    onStartPhase: () => void;
    showFail: boolean;
    showSuccess: boolean;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, phase, lang, onComplete, onRestartSection, onStartPhase, showFail, showSuccess }) => {
    const [animateOut, setAnimateOut] = useState(false);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setAnimateOut(true);
                setTimeout(onComplete, 500);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess, onComplete]);

    // TODAS AS INSTRUÇÕES EM PT-BR COM TOM MACONHEIRO
    const steps = [
        {
            id: 0,
            title: "MOVIMENTO",
            desc: "E aí mano! Mexe pra esquerda e direita aí. Pega a manha do controle!",
            icon: <ArrowLeftRight size={48} />,
            color: "text-cyan-400"
        },
        {
            id: 1,
            title: "PULO BÁSICO",
            desc: "Sussa! Agora dá um pulo básico. Toca no botão e voa, brother!",
            icon: <ArrowUp size={48} />,
            color: "text-green-400"
        },
        {
            id: 2,
            title: "HYPER JUMP",
            desc: "Ó a brisa: aperta JUSTO quando aterrissar = HYPER JUMP! 🚀",
            sub: "Espera o SLOW MOTION, mano!",
            icon: <Zap size={48} />,
            color: "text-pink-400"
        },
        {
            id: 3,
            title: "JETPACK",
            desc: "Segura o botão no ar pra voar! (TESTE GRÁTIS - COMPRE NA LOJA)",
            icon: <Rocket size={48} />,
            color: "text-orange-400"
        },
        {
            id: 4,
            title: "DESAFIO FINAL",
            desc: "Showw! Agora chega nos 500m usando tudo que aprendeu. É nóis! 💪",
            icon: <Trophy size={48} />,
            color: "text-yellow-400"
        }
    ];

    const currentStep = steps[step] || steps[0];

    // MENSAGEM DE FALHA EM PT-BR
    if (showFail) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-900 border-2 border-red-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(239,68,68,0.5)] max-w-sm mx-4">
                    <AlertCircle size={64} className="mx-auto text-red-500 mb-4 animate-bounce" />
                    <h2 className="text-3xl font-black text-white mb-2 uppercase">DEU RUIM!</h2>
                    <p className="text-red-200 mb-6">Calma, mano! O timing é tudo. Bora tentar de novo!</p>
                    <button
                        onClick={onRestartSection}
                        className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 mx-auto"
                    >
                        <Repeat size={20} />
                        TENTAR DENOVO
                    </button>
                </div>
            </div>
        );
    }

    // MENSAGEM DE SUCESSO EM PT-BR
    if (showSuccess) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-green-900/40 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-900 border-2 border-green-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(34,197,94,0.5)] max-w-sm mx-4">
                    <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4 animate-bounce" />
                    <h2 className="text-3xl font-black text-white mb-2 uppercase">ISSO AÍ! 🎉</h2>
                    <p className="text-green-200 mb-6">Pegou a visão! Mandou bem demais.</p>

                    <button
                        onClick={onComplete}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 group"
                    >
                        <span>PRÓXIMA FASE</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    // INSTRUÇÃO INICIAL (PAUSADO)
    if (phase === 'INSTRUCTION') {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-slate-900 border-2 border-cyan-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(6,182,212,0.4)] max-w-sm mx-4">
                    <div className={`${currentStep.color} mb-4 flex justify-center animate-bounce`}>
                        {currentStep.icon}
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 uppercase">{currentStep.title}</h2>
                    <p className="text-slate-300 mb-6 text-lg">{currentStep.desc}</p>
                    {currentStep.sub && (
                        <p className="text-cyan-400 text-sm font-bold italic mb-6">{currentStep.sub}</p>
                    )}
                    <button
                        onClick={onStartPhase}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black text-xl uppercase tracking-widest shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-3 group"
                    >
                        <span>BORA LÁ!</span>
                        <Rocket size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    // HUD DURANTE O JOGO (PLAYING)
    return (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
            <div className="bg-black/50 backdrop-blur px-6 py-3 rounded-full border border-white/10 flex items-center gap-4">
                <div className={`${currentStep.color}`}>
                    {React.cloneElement(currentStep.icon as React.ReactElement, { size: 24 })}
                </div>
                <div className="text-white font-bold text-sm uppercase tracking-wider">
                    {currentStep.title}
                </div>
            </div>
        </div>
    );
};
