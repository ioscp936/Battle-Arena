import React from 'react';
import { X, Shield, Zap, Heart, Crosshair, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { HeroEquipment, HeroStats, Item, ItemType, Rarity } from '../game/types';

interface InventoryModalProps {
  equipment: HeroEquipment;
  inventory: Item[];
  stats: HeroStats;
  gold: number;
  onEquip: (item: Item) => void;
  onUnequip: (slot: keyof HeroEquipment) => void;
  onUpgrade: (item: Item) => void;
  onSell: (item: Item) => void;
  onClose: () => void;
}

const RARITY_COLORS: Record<Rarity, { text: string; bg: string; border: string; glow: string }> = {
  common: { text: 'text-slate-300', bg: 'bg-slate-900', border: 'border-slate-700', glow: 'shadow-none' },
  rare: { text: 'text-sky-400', bg: 'bg-sky-950/40', border: 'border-sky-500', glow: 'shadow-sky-500/20' },
  epic: { text: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500', glow: 'shadow-purple-500/20' },
  legendary: { text: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-400', glow: 'shadow-amber-500/25' },
  mythic: { text: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-500', glow: 'shadow-red-500/30' },
};

export const InventoryModal: React.FC<InventoryModalProps> = ({
  equipment,
  inventory,
  stats,
  gold,
  onEquip,
  onUnequip,
  onUpgrade,
  onSell,
  onClose,
}) => {
  const [selectedItem, setSelectedItem] = React.useState<Item | null>(
    equipment.weapon || inventory[0] || null
  );

  const upgradeCost = selectedItem ? Math.round(50 * (selectedItem.upgradeLevel + 1) * (selectedItem.level * 0.5)) : 0;
  const canUpgrade = selectedItem && gold >= upgradeCost;

  const isEquipped = (item: Item) => {
    return Object.values(equipment).some((eq) => eq?.id === item.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-amber-400">
              TÚI ĐỒ & TRANG BỊ
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
              <span>🪙 {gold} Vàng</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng túi đồ"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Grid: Paper Doll + Bag Grid + Detail Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 overflow-y-auto flex-1">
          {/* Left: Paper Doll Equipment & Hero Stats (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-cinzel">
              Trang Bị Trên Người
            </h3>

            {/* 5 Slots */}
            <div className="grid grid-cols-5 gap-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              {(['weapon', 'armor', 'helmet', 'ring', 'relic'] as (keyof HeroEquipment)[]).map((slotKey) => {
                const item = equipment[slotKey];
                const rColor = item ? RARITY_COLORS[item.rarity] : null;

                return (
                  <button
                    key={slotKey}
                    onClick={() => item && setSelectedItem(item)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition relative ${
                      item
                        ? `${rColor?.border} ${rColor?.bg} hover:scale-105 cursor-pointer`
                        : 'border-dashed border-slate-700 bg-slate-950/60 opacity-60'
                    }`}
                  >
                    {slotKey === 'weapon' && <Zap className="w-5 h-5 text-amber-400" />}
                    {slotKey === 'armor' && <Shield className="w-5 h-5 text-indigo-400" />}
                    {slotKey === 'helmet' && <Shield className="w-5 h-5 text-emerald-400" />}
                    {slotKey === 'ring' && <Sparkles className="w-5 h-5 text-purple-400" />}
                    {slotKey === 'relic' && <Heart className="w-5 h-5 text-rose-400" />}

                    <span className="text-[9px] text-slate-400 mt-1 capitalize">{slotKey}</span>
                    {item && item.upgradeLevel > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 px-1 rounded bg-amber-500 text-slate-950 font-bold text-[9px]">
                        +{item.upgradeLevel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stats Summary */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2.5 text-xs">
              <span className="font-bold text-slate-300 font-cinzel">Chỉ Số Dũng Sĩ</span>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-red-400">
                  <Zap className="w-3.5 h-3.5" /> Công Kích (ATK)
                </span>
                <span className="font-mono font-bold">{stats.atk}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Shield className="w-3.5 h-3.5" /> Phòng Thủ (DEF)
                </span>
                <span className="font-mono font-bold">{stats.def}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Heart className="w-3.5 h-3.5" /> Sinh Lực (HP)
                </span>
                <span className="font-mono font-bold">{stats.maxHp}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Crosshair className="w-3.5 h-3.5" /> Tỉ Lệ Bạo Kích
                </span>
                <span className="font-mono font-bold">{Math.round(stats.critRate * 100)}%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <Sparkles className="w-3.5 h-3.5" /> Hút Huyết
                </span>
                <span className="font-mono font-bold">{Math.round(stats.lifesteal * 100)}%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <TrendingUp className="w-3.5 h-3.5" /> Tốc Độ Chạy
                </span>
                <span className="font-mono font-bold">{stats.speed}</span>
              </div>
            </div>
          </div>

          {/* Center: Inventory Grid (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-cinzel">
              Kho Đồ ({inventory.length} Món)
            </h3>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 max-h-80 overflow-y-auto">
              {inventory.map((item) => {
                const rColor = RARITY_COLORS[item.rarity];
                const selected = selectedItem?.id === item.id;
                const equipped = isEquipped(item);

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition relative p-1 cursor-pointer ${
                      rColor.border
                    } ${rColor.bg} ${
                      selected ? 'ring-2 ring-amber-400 scale-105' : 'hover:scale-102'
                    }`}
                  >
                    {item.type === 'weapon' && <Zap className="w-5 h-5 text-amber-400" />}
                    {item.type === 'armor' && <Shield className="w-5 h-5 text-indigo-400" />}
                    {item.type === 'helmet' && <Shield className="w-5 h-5 text-emerald-400" />}
                    {item.type === 'ring' && <Sparkles className="w-5 h-5 text-purple-400" />}
                    {item.type === 'relic' && <Heart className="w-5 h-5 text-rose-400" />}

                    <span className="text-[8px] text-slate-300 truncate w-full text-center mt-1">
                      {item.name.substring(0, 8)}..
                    </span>

                    {item.upgradeLevel > 0 && (
                      <span className="absolute top-1 right-1 px-1 rounded bg-amber-500 text-slate-950 font-bold text-[8px]">
                        +{item.upgradeLevel}
                      </span>
                    )}

                    {equipped && (
                      <span className="absolute bottom-1 left-1 px-1 rounded bg-emerald-600 text-white font-bold text-[7px]">
                        MẶC
                      </span>
                    )}
                  </button>
                );
              })}

              {inventory.length === 0 && (
                <div className="col-span-5 text-center py-10 text-slate-500 text-xs">
                  Túi đồ rỗng. Hãy tiêu diệt quái và mở hòm báu!
                </div>
              )}
            </div>
          </div>

          {/* Right: Item Inspector & Actions (3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            {selectedItem ? (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-cinzel font-bold text-sm ${
                      RARITY_COLORS[selectedItem.rarity].text
                    }`}
                  >
                    {selectedItem.name}
                  </span>
                  {selectedItem.upgradeLevel > 0 && (
                    <span className="text-amber-400 font-bold text-xs">
                      (+{selectedItem.upgradeLevel})
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  {selectedItem.description}
                </div>

                {/* Stats */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5 text-xs">
                  {selectedItem.stats.atk && (
                    <div className="flex justify-between text-red-400">
                      <span>Công Kích:</span>
                      <span className="font-mono font-bold">
                        +{Math.round(selectedItem.stats.atk * (1 + selectedItem.upgradeLevel * 0.15))}
                      </span>
                    </div>
                  )}
                  {selectedItem.stats.def && (
                    <div className="flex justify-between text-blue-400">
                      <span>Phòng Thủ:</span>
                      <span className="font-mono font-bold">
                        +{Math.round(selectedItem.stats.def * (1 + selectedItem.upgradeLevel * 0.15))}
                      </span>
                    </div>
                  )}
                  {selectedItem.stats.hp && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Sinh Lực:</span>
                      <span className="font-mono font-bold">
                        +{Math.round(selectedItem.stats.hp * (1 + selectedItem.upgradeLevel * 0.15))}
                      </span>
                    </div>
                  )}
                  {selectedItem.stats.critRate && (
                    <div className="flex justify-between text-amber-400">
                      <span>Bạo Kích:</span>
                      <span className="font-mono font-bold">
                        +{Math.round(selectedItem.stats.critRate * 100)}%
                      </span>
                    </div>
                  )}
                  {selectedItem.stats.lifesteal && (
                    <div className="flex justify-between text-rose-400">
                      <span>Hút Huyết:</span>
                      <span className="font-mono font-bold">
                        +{Math.round(selectedItem.stats.lifesteal * 100)}%
                      </span>
                    </div>
                  )}
                  {selectedItem.stats.speed && (
                    <div className="flex justify-between text-sky-400">
                      <span>Tốc Độ:</span>
                      <span className="font-mono font-bold">+{selectedItem.stats.speed}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto">
                  {isEquipped(selectedItem) ? (
                    <button
                      onClick={() => onUnequip(selectedItem.type as keyof HeroEquipment)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      Tháo Trang Bị
                    </button>
                  ) : (
                    <button
                      onClick={() => onEquip(selectedItem)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                    >
                      Trang Bị Ngay
                    </button>
                  )}

                  <button
                    onClick={() => onUpgrade(selectedItem)}
                    disabled={!canUpgrade}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Cường Hóa (+{upgradeCost}🪙)</span>
                  </button>

                  <button
                    onClick={() => onSell(selectedItem)}
                    className="w-full py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Bán (+{selectedItem.value}🪙)</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Chọn một trang bị để xem chi tiết và nâng cấp
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
