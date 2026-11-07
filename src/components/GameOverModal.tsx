import React from 'react';
import { Skull, RotateCcw, Home, Award, Swords } from 'lucide-react';

interface GameOverModalProps {
  stageNumber: number;
  maxCombo: number;
  totalKills: number;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stageNumber,
  maxCombo,
  totalKills,
  onRestart,
  onReturnTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-slate-950 border-2 border-red-900 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(239,68,68,0.3)] flex flex-col items-center text-center">
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-700/80 flex items-center justify-center mb-3">
          <Skull className="w-9 h-9 text-red-500 animate-pulse" />
        </div>

        <h2 className="font-cinzel text-3xl font-black text-red-500 tracking-wider">
          TỬ TRẬN
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Dũng sĩ đã ngã xuống trước bầy quái thú cuồng bạo. Hãy rèn luyện và tái sinh báo thù!
        </p>

        {/* Run Stats */}
        <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 my-5 flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Award className="w-4 h-4 text-amber-400" /> Ải Đạt Được
            </span>
            <span className="font-bold font-mono text-amber-300 text-sm">Ải {stageNumber}/5</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Swords className="w-4 h-4 text-red-400" /> Combo Cao Nhất
            </span>
            <span className="font-bold font-mono text-red-400 text-sm">{maxCombo} HITS</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Skull className="w-4 h-4 text-purple-400" /> Quái Vật Đã Diệt
            </span>
            <span className="font-bold font-mono text-purple-300 text-sm">{totalKills} Con</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            data-start="true"
            onClick={onRestart}
            className="w-full sm:w-1/2 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-cinzel font-bold text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TÁI ĐẤU NGAY</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="w-full sm:w-1/2 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-cinzel font-bold text-xs tracking-wider transition flex items-center justify-center gap-2 border border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span>MÀN HÌNH CHÍNH</span>
          </button>
        </div>
      </div>
    </div>
  );
};
