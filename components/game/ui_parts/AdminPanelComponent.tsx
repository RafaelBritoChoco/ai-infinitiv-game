import React, { useState } from 'react';
import { Shield, X, Trash2, Loader2 } from 'lucide-react';

export const AdminPanel = ({ onClose }: { onClose: () => void }) => {
    const [isResetting, setIsResetting] = useState(false);
    const [resetResult, setResetResult] = useState<string | null>(null);

    const handleResetLeaderboard = async () => {
        if (!window.confirm('⚠️ TEM CERTEZA que quer ZERAR o ranking global? Esta ação não pode ser desfeita!')) return;
        
        setIsResetting(true);
        setResetResult(null);
        
        try {
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'RESET_LEADERBOARD_2025' })
            });
            const data = await response.json();
            
            if (data.success) {
                setResetResult('✅ Ranking global ZERADO com sucesso!');
            } else {
                setResetResult(`❌ Erro: ${data.error || 'Falha ao resetar'}`);
            }
        } catch (err: any) {
            setResetResult(`❌ Erro de conexão: ${err.message}`);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-red-500 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-red-400 flex items-center gap-2">
                        <Shield size={24} /> ADMIN PANEL
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                <p className="text-slate-400 text-sm mb-6">⚠️ Área restrita para administradores. Ações aqui afetam TODOS os jogadores.</p>
                
                {/* RESET LEADERBOARD */}
                <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 mb-4">
                    <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                        <Trash2 size={18} /> Zerar Ranking Global
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">Remove TODAS as pontuações do ranking mundial. Isso não pode ser desfeito!</p>
                    <button
                        onClick={handleResetLeaderboard}
                        disabled={isResetting}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isResetting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        {isResetting ? 'ZERANDO...' : 'ZERAR RANKING'}
                    </button>
                </div>
                
                {resetResult && (
                    <div className={`p-3 rounded-lg text-sm font-bold ${resetResult.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {resetResult}
                    </div>
                )}
                
                <p className="text-[10px] text-slate-600 mt-4 text-center">ChocoPro Admin v1.0</p>
            </div>
        </div>
    );
};
