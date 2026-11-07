import React from 'react';
import { X, Check, Lock, Sparkles, Shield, Zap, Flame, Snowflake, Skull, Sun } from 'lucide-react';
import { Outfit } from '../game/types';

interface OutfitsModalProps {
  outfits: Outfit[];
  activeOutfitId: string;
  onSelectOutfit: (outfitId: string) => void;
  onClose: () => void;
}

export const OutfitsModal: React.FC<OutfitsModalProps> = ({
  outfits,
  activeOutfitId,
  onSelectOutfit,
  onClose,
}) => {
  const [selectedOutfitId, setSelectedOutfitId] = React.useState<string>(activeOutfitId);
  const selected = outfits.find((o) => o.id === selectedOutfitId) || outfits[0];

  const getOutfitIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-6 h-6 text-orange-500" />;
      case 'Snowflake': return <Snowflake className="w-6 h-6 text-sky-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-emerald-400" />;
      case 'Sun': return <Sun className="w-6 h-6 text-amber-400" />;
      case 'Skull': return <Skull className="w-6 h-6 text-purple-400" />;
      default: return <Shield className="w-6 h-6 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-400">
              TỦ ĐỒ TRANG PHỤC HUYỀN THOẠI
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thay đổi ngoại hình & Hiệu ứng kiếm khí</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng tủ đồ"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 overflow-y-auto flex-1">
          {/* Outfits List (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-cinzel">
              Danh Sách Trang Phục ({outfits.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {outfits.map((outfit) => {
                const isCurrentActive = activeOutfitId === outfit.id;
                const isSelected = selectedOutfitId === outfit.id;

                return (
                  <button
                    key={outfit.id}
                    onClick={() => setSelectedOutfitId(outfit.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-slate-900 shadow-lg shadow-amber-500/20'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    {/* Visual miniature */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner flex-shrink-0"
                      style={{
                        backgroundColor: outfit.visuals.bodyColor,
                        borderColor: outfit.visuals.armorColor,
                      }}
                    >
                      {getOutfitIcon(outfit.icon)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-200 truncate font-cinzel">
                          {outfit.name}
                        </span>
                        {!outfit.unlocked && <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
                      </div>
                      <span className="text-[11px] text-amber-400 block truncate">
                        {outfit.title}
                      </span>
                    </div>

                    {isCurrentActive && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[9px]">
                        ĐANG MẶC
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Preview & Showcase (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            {/* Visual Render Canvas Replica */}
            <div className="relative w-full h-44 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
              {/* Dynamic Aura background */}
              <div
                className="absolute w-36 h-36 rounded-full blur-2xl animate-pulse"
                style={{ backgroundColor: selected.visuals.auraColor }}
              />

              {/* Rendered Hero Silhouette Showcase */}
              <div className="relative flex flex-col items-center">
                {/* Cloak */}
                <div
                  className="w-14 h-16 rounded-t-lg -mb-6 shadow-xl"
                  style={{ backgroundColor: selected.visuals.cloakColor }}
                />
                {/* Torso & Armor */}
                <div
                  className="w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-2xl relative z-10"
                  style={{
                    backgroundColor: selected.visuals.bodyColor,
                    borderColor: selected.visuals.armorColor,
                  }}
                >
                  {getOutfitIcon(selected.icon)}
                </div>
                {/* Glowing Sword */}
                <div
                  className="w-24 h-3 rounded-full mt-2 shadow-lg animate-pulse"
                  style={{
                    backgroundColor: selected.visuals.weaponColor,
                    boxShadow: `0 0 15px ${selected.visuals.trailColor}`,
                  }}
                />
              </div>

              {/* Outfit Name Tag */}
              <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono">
                Kiếm khí: <span style={{ color: selected.visuals.trailColor }}>{selected.visuals.trailColor}</span>
              </div>
            </div>

            {/* Lore & Info */}
            <div>
              <h4 className="font-cinzel text-lg font-bold text-amber-300">
                {selected.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {selected.description}
              </p>
            </div>

            {/* Stat Bonuses */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5 text-xs">
              <span className="font-bold text-amber-400 text-[11px] font-cinzel">
                Gia Tăng Thuộc Tính:
              </span>
              <div className="flex justify-between text-slate-300">
                <span>Công Kích (ATK):</span>
                <span className="font-mono font-bold text-red-400">
                  {selected.statBonus.atkPct > 0 ? `+${Math.round(selected.statBonus.atkPct * 100)}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Phòng Thủ (DEF):</span>
                <span className="font-mono font-bold text-blue-400">
                  {selected.statBonus.defPct > 0 ? `+${Math.round(selected.statBonus.defPct * 100)}%` : `${Math.round(selected.statBonus.defPct * 100)}%`}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Bạo Kích (Crit):</span>
                <span className="font-mono font-bold text-amber-400">
                  +{Math.round(selected.statBonus.critPct * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tốc Độ Chạy:</span>
                <span className="font-mono font-bold text-sky-400">
                  +{Math.round(selected.statBonus.speedPct * 100)}%
                </span>
              </div>
              {selected.statBonus.lifestealPct && (
                <div className="flex justify-between text-slate-300">
                  <span>Hút Huyết:</span>
                  <span className="font-mono font-bold text-rose-400">
                    +{Math.round(selected.statBonus.lifestealPct * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Unlock requirement or Action button */}
            {!selected.unlocked ? (
              <div className="bg-red-950/50 p-3 rounded-xl border border-red-900/60 text-xs text-red-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>Mở khóa: {selected.unlockRequirement}</span>
              </div>
            ) : (
              <button
                onClick={() => onSelectOutfit(selected.id)}
                disabled={activeOutfitId === selected.id}
                className={`w-full py-3 rounded-xl font-cinzel font-bold text-sm tracking-wider transition flex items-center justify-center gap-2 ${
                  activeOutfitId === selected.id
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer shadow-lg shadow-amber-500/20'
                }`}
              >
                {activeOutfitId === selected.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ĐANG TRANG BỊ</span>
                  </>
                ) : (
                  <span>MẶC TRANG PHỤC NÀY</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
