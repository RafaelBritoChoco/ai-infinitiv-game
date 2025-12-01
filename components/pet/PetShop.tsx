import React, { useState, useEffect } from 'react';
import { ShoppingBag, Coins, X, Check, AlertCircle } from 'lucide-react';
import { SHOP_ITEMS } from '../../pet-constants';
import { buyItem, getPetStateForUser } from './pet-service';
import { PetState } from '../../pet-types';

interface PetShopProps {
    onClose: () => void;
    onBuySuccess: () => void;
}

export const PetShop: React.FC<PetShopProps> = ({ onClose, onBuySuccess }) => {
    const [coins, setCoins] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [buyingId, setBuyingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadCoins();
    }, []);

    const loadCoins = async () => {
        const pet = await getPetStateForUser();
        if (pet) {
            setCoins(pet.coins || 0);
        }
        setLoading(false);
    };

    const handleBuy = async (itemId: string) => {
        setBuyingId(itemId);
        setMessage(null);

        const result = await buyItem(itemId);

        if (result.success) {
            setMessage({ text: result.message, type: 'success' });
            setCoins(prev => prev - (SHOP_ITEMS.find(i => i.id === itemId)?.price || 0));
            onBuySuccess();

            // Clear success message after 2s
            setTimeout(() => setMessage(null), 2000);
        } else {
            setMessage({ text: result.message, type: 'error' });
        }

        setBuyingId(null);
    };

    return (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border-2 border-yellow-600 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-500">
                        <ShoppingBag size={24} />
                        <h2 className="text-xl font-black uppercase italic">Pet Shop</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Coin Balance */}
                <div className="bg-slate-900 p-3 flex justify-end border-b border-slate-800">
                    <div className="bg-slate-800 px-3 py-1 rounded-full flex items-center gap-2 border border-yellow-500/30">
                        <Coins size={16} className="text-yellow-400" />
                        <span className="text-yellow-400 font-bold font-mono">{loading ? '...' : coins}</span>
                    </div>
                </div>

                {/* Message Toast */}
                {message && (
                    <div className={`p-2 text-center text-sm font-bold ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* Items Grid */}
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
                    {SHOP_ITEMS.map((item) => (
                        <div key={item.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700 hover:border-yellow-500/50 transition-all group">
                            <div className="text-4xl mb-2 text-center group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <h3 className="text-white font-bold text-sm text-center mb-1">{item.name}</h3>
                            <p className="text-slate-400 text-[10px] text-center mb-3 h-8 leading-tight">
                                {item.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="text-yellow-400 font-mono text-xs font-bold">
                                    💰 {item.price}
                                </div>
                                <button
                                    onClick={() => handleBuy(item.id)}
                                    disabled={buyingId !== null || coins < item.price}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1
                                        ${coins >= item.price
                                            ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-600/20'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                >
                                    {buyingId === item.id ? '...' : 'Comprar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
