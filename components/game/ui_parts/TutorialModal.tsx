import React from 'react';
import { HelpCircle, Smartphone, ArrowUp, Coins, Skull, Check } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

export const TutorialModal = ({ onClose, lang }: { onClose: () => void, lang: string }) => {
    const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.EN;

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="max-w-md w-full bg-[#020617] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2 relative z-10 italic">
                    <HelpCircle size={28} className="text-cyan-400" /> 
                    {t.tutorialContent.title}
                </h2>

                <div className="space-y-4 relative z-10">
                    <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <div className="p-2 bg-cyan-900/30 rounded-lg text-cyan-400 shrink-0">
                            <Smartphone size={20} />
                        </div>
                        <p className="text-slate-300 text-sm font-medium pt-1">{t.tutorialContent.step1}</p>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <div className="p-2 bg-green-900/30 rounded-lg text-green-400 shrink-0">
                            <ArrowUp size={20} />
                        </div>
                        <p className="text-slate-300 text-sm font-medium pt-1">{t.tutorialContent.step2}</p>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <div className="p-2 bg-yellow-900/30 rounded-lg text-yellow-400 shrink-0">
                            <Coins size={20} />
                        </div>
                        <p className="text-slate-300 text-sm font-medium pt-1">{t.tutorialContent.step3}</p>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <div className="p-2 bg-red-900/30 rounded-lg text-red-400 shrink-0">
                            <Skull size={20} />
                        </div>
                        <p className="text-slate-300 text-sm font-medium pt-1">{t.tutorialContent.step4}</p>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 group relative z-10"
                >
                    <Check size={20} className="group-hover:scale-110 transition-transform" />
                    {t.tutorialContent.gotIt}
                </button>
            </div>
        </div>
    );
};
