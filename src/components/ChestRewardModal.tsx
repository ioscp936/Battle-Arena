import React from 'react';
import { Sparkles, Check, ArrowRight, Shield, Zap, Heart, Crosshair } from 'lucide-react';
import { ChestEntity, Item, Rarity } from '../game/types';

interface ChestRewardModalProps {
  chest: ChestEntity;
  onEquipItem: (item: Item) => void;
  onClaimAll: () => void;
  onNextStage: () => void;
}

const RARITY_COLORS: Record<Rarity, { text: string; bg: string; border: string }> = {
  common: { text: 'text-slate-300', bg: 'bg-slate-800/80', border: 'border-slate-600' },
  rare: { text: 'text-sky-400', bg: 'bg-sky-950/70', border: 'border-sky-500' },
  epic: { text: 'text-purple-400', bg: 'bg-purple-950/70', border: 'border-purple-500' },
  legendary: { text: 'text-amber-400', bg: 'bg-amber-950/70', border: 'border-amber-400' },
  mythic: { text: 'text-red-400', bg: 'bg-red-950/70', border: 'border-red-500' },
};

const RARITY_LABELS: Record<Rarity, string> = {
  common: 'PHỔ THÔNG',
  rare: 'HIẾM',
  epic: 'SỬ THI',
  legendary: 'HUYỀN THOẠI',
  mythic: 'THẦN THOẠI',
};

export const ChestRewardModal: React.FC<ChestRewardModalProps> = ({
  chest,
  onEquipItem,
  onClaimAll,
  onNextStage,
}) => {
  const [equippedIds, setEquippedIds] = React.useState<Set<string>>(new Set());

  const handleEquip = (item: Item) => {
    onEquipItem(item);
    setEquippedIds((prev) => new Set(prev).add(item.id));
  };

  const chestTheme = RARITY_COLORS[chest.tier] || RARITY_COLORS.rare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center text-center">
        {/* Top Glow & Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-300 font-cinzel text-xs font-bold tracking-widest mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>MỞ HÒM BÁU THÀNH CÔNG!</span>
        </div>

        {/* Chest Tier Title */}
        <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-amber-300">
          RƯƠNG {RARITY_LABELS[chest.tier]}
        </h2>

        {/* Gold Reward */}
        <div className="flex items-center gap-2 my-2 text-amber-400 font-mono font-bold text-lg bg-amber-950/50 px-4 py-1.5 rounded-xl border border-amber-600/40">
          <span>🪙 +{chest.gold} Vàng</span>
        </div>

        <p className="text-slate-400 text-xs sm:text-sm mb-5">
          Vật phẩm thần khí rơi ra từ hòm rương. Hãy trang bị ngay hoặc cất vào túi đồ!
        </p>

        {/* Items List */}
        <div className="w-full flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
          {chest.items.map((item) => {
            const isEquipped = equippedIds.has(item.id);
            const rColors = RARITY_COLORS[item.rarity];

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border ${rColors.border} ${rColors.bg} transition`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${rColors.border} bg-slate-950`}
                  >
                    {item.type === 'weapon' && <Zap className="w-6 h-6 text-amber-400" />}
                    {item.type === 'armor' && <Shield className="w-6 h-6 text-indigo-400" />}
                    {item.type === 'helmet' && <Shield className="w-6 h-6 text-emerald-400" />}
                    {item.type === 'ring' && <Sparkles className="w-6 h-6 text-purple-400" />}
                    {item.type === 'relic' && <Heart className="w-6 h-6 text-rose-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${rColors.text}`}>{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-slate-300 font-mono">
                        Cấp {item.level}
                      </span>
                    </div>

                    {/* Stats pills */}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-300 mt-1">
                      {item.stats.atk && (
                        <span className="flex items-center gap-0.5 text-red-400">
                          <Zap className="w-3 h-3" /> Công +{item.stats.atk}
                        </span>
                      )}
                      {item.stats.def && (
                        <span className="flex items-center gap-0.5 text-blue-400">
                          <Shield className="w-3 h-3" /> Thủ +{item.stats.def}
                        </span>
                      )}
                      {item.stats.hp && (
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <Heart className="w-3 h-3" /> HP +{item.stats.hp}
                        </span>
                      )}
                      {item.stats.critRate && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Crosshair className="w-3 h-3" /> Bạo +
                          {Math.round(item.stats.critRate * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleEquip(item)}
                  disabled={isEquipped}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    isEquipped
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md'
                  }`}
                >
                  {isEquipped ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã Mặc</span>
                    </>
                  ) : (
                    <span>Trang Bị</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full">
          <button
            onClick={onClaimAll}
            className="w-full sm:w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition"
          >
            Cất Vào Túi Đồ
          </button>

          <button
            onClick={onNextStage}
            className="w-full sm:w-1/2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-cinzel font-black text-sm tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
          >
            <span>ẢI TIẾP THEO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
