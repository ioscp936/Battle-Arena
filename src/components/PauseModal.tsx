import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnTitle,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-slate-950 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="font-cinzel text-2xl font-bold text-amber-400 mb-2">
          TẠM DỪNG TRẬN ĐẤU
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Trò chơi đang tạm ngưng. Hãy sẵn sàng trước khi tiếp tục giao tranh!
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinzel font-bold text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>TIẾP TỤC CHIẾN ĐẤU</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition flex items-center justify-center gap-2"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>Bật Âm Thanh</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Tắt Âm Thanh</span>
              </>
            )}
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi Lại Ải Này</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs border border-slate-800 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Về Màn Hình Chính</span>
          </button>
        </div>
      </div>
    </div>
  );
};
