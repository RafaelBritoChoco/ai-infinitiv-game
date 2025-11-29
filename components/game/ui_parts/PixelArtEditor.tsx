import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Eraser, Palette, Download, Undo, Redo, Eye, Trash2 } from 'lucide-react';

interface PixelArtEditorProps {
    onClose: () => void;
    onSave: (pixels: number[][], name: string, color: string) => void;
}

const GRID_SIZE = 24;
const COLOR_PALETTE = [
    { id: 0, name: 'Transparente', color: 'transparent' },
    { id: 1, name: 'Preto', color: '#0f172a' },
    { id: 2, name: 'Pele', color: '#d4a574' },
    { id: 3, name: 'Branco', color: '#ffffff' },
    { id: 4, name: 'Branco Olho', color: '#ffffff' },
    { id: 5, name: 'Pupila', color: '#000000' },
    { id: 6, name: 'Detalhe', color: '#facc15' },
    { id: 7, name: 'Vermelho', color: '#dc2626' },
    { id: 8, name: 'Verde', color: '#22c55e' },
    { id: 9, name: 'Azul', color: '#3b82f6' },
    { id: 10, name: 'Roxo', color: '#a855f7' },
    { id: 11, name: 'Rosa', color: '#ec4899' },
    { id: 12, name: 'Laranja', color: '#f97316' },
    { id: 13, name: 'Cinza', color: '#94a3b8' },
    { id: 14, name: 'Marrom', color: '#78350f' }
];

export const PixelArtEditor: React.FC<PixelArtEditorProps> = ({ onClose, onSave }) => {
    const [grid, setGrid] = useState<number[][]>(() =>
        Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
    );
    const [selectedColor, setSelectedColor] = useState(2); // Default to skin color
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [showPreview, setShowPreview] = useState(true);
    const [characterName, setCharacterName] = useState('MEU PERSONAGEM');
    const [mainColor, setMainColor] = useState('#d4a574');
    const [history, setHistory] = useState<number[][][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Save to history
    const saveToHistory = (newGrid: number[][]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newGrid)));
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Undo/Redo
    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setGrid(JSON.parse(JSON.stringify(history[historyIndex - 1])));
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setGrid(JSON.parse(JSON.stringify(history[historyIndex + 1])));
        }
    };

    // Paint pixel
    const paintPixel = (row: number, col: number) => {
        const newGrid = [...grid];
        const value = tool === 'eraser' ? 0 : selectedColor;
        if (newGrid[row][col] !== value) {
            newGrid[row] = [...newGrid[row]];
            newGrid[row][col] = value;
            setGrid(newGrid);
        }
    };

    const handleMouseDown = (row: number, col: number) => {
        setIsDrawing(true);
        paintPixel(row, col);
    };

    const handleMouseEnter = (row: number, col: number) => {
        if (isDrawing) {
            paintPixel(row, col);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory(grid);
        }
    };

    // Touch support
    const handleTouchStart = (row: number, col: number, e: React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        paintPixel(row, col);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        e.preventDefault();

        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.hasAttribute('data-row')) {
            const row = parseInt(element.getAttribute('data-row') || '0');
            const col = parseInt(element.getAttribute('data-col') || '0');
            paintPixel(row, col);
        }
    };

    const handleTouchEnd = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory(grid);
        }
    };

    const clearCanvas = () => {
        const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        setGrid(newGrid);
        saveToHistory(newGrid);
    };

    const handleSave = () => {
        onSave(grid, characterName, mainColor);
        onClose();
    };

    const getColorForValue = (val: number): string => {
        const paletteColor = COLOR_PALETTE.find(c => c.id === val);
        if (paletteColor && paletteColor.color !== 'transparent') {
            return paletteColor.color;
        }
        return 'transparent';
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-2 backdrop-blur-md">
            <div className="w-full max-w-5xl h-[95vh] bg-slate-900 border-2 border-cyan-500 rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/20">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Palette size={24} className="text-cyan-400" />
                        <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">
                            Editor de Personagem
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col lg:flex-row gap-4">

                    {/* Left Panel - Canvas */}
                    <div className="flex-1 flex flex-col items-center gap-4">

                        {/* Toolbar */}
                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                            <button
                                onClick={() => setTool('brush')}
                                className={`p-2 rounded-lg transition-all ${tool === 'brush' ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                title="Pincel"
                            >
                                <Palette size={20} />
                            </button>
                            <button
                                onClick={() => setTool('eraser')}
                                className={`p-2 rounded-lg transition-all ${tool === 'eraser' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                title="Borracha"
                            >
                                <Eraser size={20} />
                            </button>
                            <div className="w-px h-6 bg-slate-700 mx-1" />
                            <button
                                onClick={undo}
                                disabled={historyIndex <= 0}
                                className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Desfazer"
                            >
                                <Undo size={20} />
                            </button>
                            <button
                                onClick={redo}
                                disabled={historyIndex >= history.length - 1}
                                className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Refazer"
                            >
                                <Redo size={20} />
                            </button>
                            <div className="w-px h-6 bg-slate-700 mx-1" />
                            <button
                                onClick={clearCanvas}
                                className="p-2 rounded-lg bg-slate-700 text-red-400 hover:bg-red-900/50 transition-all"
                                title="Limpar Tudo"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`p-2 rounded-lg transition-all ${showPreview ? 'bg-green-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                title="Mostrar Preview"
                            >
                                <Eye size={20} />
                            </button>
                        </div>

                        {/* Grid Canvas */}
                        <div
                            ref={canvasRef}
                            className="bg-slate-800 p-2 rounded-xl border-2 border-slate-700 select-none"
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchMove}
                        >
                            <div
                                className="grid gap-0 bg-slate-900 border border-slate-600"
                                style={{
                                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                                    width: 'min(80vw, 480px)',
                                    height: 'min(80vw, 480px)'
                                }}
                            >
                                {grid.map((row, rowIndex) =>
                                    row.map((cell, colIndex) => (
                                        <div
                                            key={`${rowIndex}-${colIndex}`}
                                            data-row={rowIndex}
                                            data-col={colIndex}
                                            className="border border-slate-700/30 cursor-crosshair transition-all hover:ring-1 hover:ring-cyan-400"
                                            style={{
                                                backgroundColor: cell === 0 ? 'transparent' : getColorForValue(cell),
                                                aspectRatio: '1/1'
                                            }}
                                            onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                                            onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                                            onTouchStart={(e) => handleTouchStart(rowIndex, colIndex, e)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Tools & Preview */}
                    <div className="w-full lg:w-80 flex flex-col gap-4">

                        {/* Preview */}
                        {showPreview && (
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Preview</h3>
                                <div className="flex justify-center items-center bg-slate-900 rounded-lg p-8 border border-slate-700">
                                    <svg
                                        viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
                                        className="w-32 h-32 filter drop-shadow-xl"
                                        shapeRendering="crispEdges"
                                    >
                                        {grid.map((row, y) =>
                                            row.map((val, x) => {
                                                if (val === 0) return null;
                                                const color = getColorForValue(val);
                                                return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                                            })
                                        )}
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Character Info */}
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Informações</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Nome do Personagem</label>
                                    <input
                                        type="text"
                                        value={characterName}
                                        onChange={(e) => setCharacterName(e.target.value.toUpperCase().slice(0, 15))}
                                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="NOME"
                                        maxLength={15}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Cor Principal</label>
                                    <div className="flex gap-2 mt-1">
                                        <input
                                            type="color"
                                            value={mainColor}
                                            onChange={(e) => setMainColor(e.target.value)}
                                            className="w-12 h-10 rounded-lg cursor-pointer border-2 border-slate-700"
                                        />
                                        <input
                                            type="text"
                                            value={mainColor}
                                            onChange={(e) => setMainColor(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Color Palette */}
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1 overflow-y-auto">
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Paleta de Cores</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {COLOR_PALETTE.map((colorItem) => (
                                    <button
                                        key={colorItem.id}
                                        onClick={() => setSelectedColor(colorItem.id)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${selectedColor === colorItem.id
                                                ? 'bg-cyan-500 scale-105 shadow-lg'
                                                : 'bg-slate-700 hover:bg-slate-600'
                                            }`}
                                        title={colorItem.name}
                                    >
                                        <div
                                            className="w-full h-8 rounded border-2 border-slate-900"
                                            style={{
                                                backgroundColor: colorItem.color === 'transparent' ? '#1e293b' : colorItem.color,
                                                backgroundImage: colorItem.color === 'transparent' ? 'repeating-linear-gradient(45deg, #334155 0, #334155 2px, #1e293b 2px, #1e293b 4px)' : 'none'
                                            }}
                                        />
                                        <span className={`text-[9px] font-bold uppercase ${selectedColor === colorItem.id ? 'text-black' : 'text-slate-400'}`}>
                                            {colorItem.name.slice(0, 8)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Actions */}
                <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                        <X size={20} />
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                        <Save size={20} />
                        Salvar Personagem
                    </button>
                </div>
            </div>
        </div>
    );
};
