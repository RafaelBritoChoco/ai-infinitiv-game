import React, { useState } from 'react';
import { Smartphone, Gamepad2, Move, MousePointer2, Check, ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

interface ControlSelectionModalProps {
    onConfirm: (mode: 'BUTTONS' | 'TILT' | 'ARROWS' | 'JOYSTICK') => void;
    lang: string;
}

export const ControlSelectionModal: React.FC<ControlSelectionModalProps> = ({ onConfirm, lang }) => {
    const [selected, setSelected] = useState<'BUTTONS' | 'TILT' | 'ARROWS' | 'JOYSTICK'>('ARROWS');
    const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.EN;

    const options = [
        {
            id: 'ARROWS',
            icon: MousePointer2,
            title: 'TELA DIVIDIDA',
            desc: 'Lado esquerdo e direito da tela. Simples e rápido!',
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/50'
        },
        {
            id: 'TILT',
            icon: Move,
            title: 'INCLINAR CELULAR',
            desc: 'Balança o celular pra mover. Top demais!',
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/50'
        }
    ];

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-6 text-center border-b border-slate-800 bg-slate-950">
                    <h2 className="text-2xl font-black italic text-white mb-1 uppercase tracking-tighter">
                        ESCOLHE TEU CONTROLE
                    </h2>
                    <p className="text-slate-400 text-xs">
                        Seleciona como tu quer jogar. Dá pra mudar depois nas configurações.
                    </p>
                </div>

                {/* Options Grid - VERTICAL LAYOUT for Mobile */}
                <div className="p-4 grid grid-cols-1 gap-3 bg-slate-900/50 max-h-[60vh] overflow-y-auto">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setSelected(opt.id as any)}
                            className={`relative p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 text-left
                                ${selected === opt.id
                                    ? `${opt.bg} ${opt.border} shadow-[0_0_20px_rgba(0,0,0,0.3)] scale-[1.02]`
                                    : 'bg-slate-800/50 border-transparent hover:bg-slate-800 hover:border-slate-600 opacity-80'
                                }
                            `}
                        >
                            <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center ${selected === opt.id ? 'bg-black/20' : 'bg-slate-700/50'} ${opt.color}`}>
                                <opt.icon size={28} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-sm uppercase tracking-wider mb-1 ${selected === opt.id ? 'text-white' : 'text-slate-300'}`}>
                                    {opt.title}
                                </h3>
                                <p className="text-[11px] text-slate-400 leading-tight">
                                    {opt.desc}
                                </p>
                            </div>
                            {selected === opt.id && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg shrink-0">
                                    <Check size={14} className="text-black stroke-[3]" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-center">
                    <button
                        onClick={() => onConfirm(selected)}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-black text-xl uppercase tracking-widest shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-3 group"
                    >
                        <span>CONFIRMAR</span>
                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};
