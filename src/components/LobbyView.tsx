import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Swords,
  Sparkles,
  Coins,
  Volume2,
  VolumeX,
  ChevronRight,
  Flame,
  Award,
  Crown,
  CheckCircle2,
  User,
  Shirt,
  RotateCcw,
  Skull,
  Package,
  Wind,
  Zap,
} from 'lucide-react';
import {
  HeroClass,
  HeroEquipment,
  HeroStats,
  LobbyEquipment,
  LobbyItem,
  Outfit,
  QuestItem,
  ShopTier,
  WheelReward,
} from '../game/types';
import {
  LOBBY_SHOP_WEAPONS,
  LOBBY_SHOP_ARMORS,
  WHEEL_REWARDS,
  calculateWheelCost,
} from '../game/rules';
import { sounds } from '../game/audio';

interface LobbyViewProps {
  heroLevel: number;
  heroExp: number;
  expNext: number;
  gold: number;
  heroStats: HeroStats;
  selectedHeroClass: HeroClass;
  activeOutfit: Outfit;
  lobbyEquipment: LobbyEquipment;
  unlockedLobbyItems: string[];
  quests: QuestItem[];
  wheelSpins: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onBuyLobbyItem: (item: LobbyItem) => void;
  onEquipLobbyItem: (item: LobbyItem) => void;
  onUnequipLobbyItem: (type: 'weapon' | 'armor') => void;
  onClaimQuestReward: (questId: string) => void;
  onSpinWheel: (reward: WheelReward, cost: number) => void;
  onOpenCharacterSelect: () => void;
  onOpenOutfits: () => void;
  onOpenMapSelect: () => void;
  onStartGame: () => void;
  onReturnTitle: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  heroLevel,
  heroExp,
  expNext,
  gold,
  heroStats,
  selectedHeroClass,
  activeOutfit,
  lobbyEquipment,
  unlockedLobbyItems,
  quests,
  wheelSpins,
  isMuted,
  onToggleMute,
  onBuyLobbyItem,
  onEquipLobbyItem,
  onUnequipLobbyItem,
  onClaimQuestReward,
  onSpinWheel,
  onOpenCharacterSelect,
  onOpenOutfits,
  onOpenMapSelect,
  onStartGame,
  onReturnTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'quests' | 'wheel'>('shop');
  const [shopCategory, setShopCategory] = useState<'weapon' | 'armor'>('weapon');
  const [shopTierFilter, setShopTierFilter] = useState<ShopTier | 'all'>('all');

  // Lucky wheel animation state
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelResult, setWheelResult] = useState<WheelReward | null>(null);
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const expPct = Math.min(100, (heroExp / expNext) * 100);
  const currentWheelCost = calculateWheelCost(wheelSpins);

  const allShopItems = shopCategory === 'weapon' ? LOBBY_SHOP_WEAPONS : LOBBY_SHOP_ARMORS;
  const filteredShopItems = allShopItems.filter((item) =>
    shopTierFilter === 'all' ? true : item.tier === shopTierFilter
  );

  const claimableQuestsCount = quests.filter((q) => q.completed && !q.claimed).length;

  // Draw the lucky wheel canvas
  useEffect(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 12;
    const numSlices = WHEEL_REWARDS.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(wheelAngle);

    // Draw wheel segments
    for (let i = 0; i < numSlices; i++) {
      const reward = WHEEL_REWARDS[i];
      const startA = i * sliceAngle;
      const endA = startA + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.fillStyle = reward.color;
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text label inside slice
      ctx.save();
      ctx.rotate(startA + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(reward.label, radius - 16, 4);
      ctx.restore();
    }

    // Outer rim lights
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 16; i++) {
      const dotA = (i / 16) * Math.PI * 2;
      ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(Math.cos(dotA) * (radius - 4), Math.sin(dotA) * (radius - 4), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Center Hub knob
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LUCKY', centerX, centerY);
  }, [wheelAngle]);

  // Handle spin action
  const handleSpinClick = () => {
    if (isSpinning || gold < currentWheelCost) return;

    setIsSpinning(true);
    setWheelResult(null);
    sounds.playChestOpen();

    // Weighted roll
    const totalWeight = WHEEL_REWARDS.reduce((acc, r) => acc + r.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosenIdx = 0;
    for (let i = 0; i < WHEEL_REWARDS.length; i++) {
      if (rand < WHEEL_REWARDS[i].weight) {
        chosenIdx = i;
        break;
      }
      rand -= WHEEL_REWARDS[i].weight;
    }

    const chosenReward = WHEEL_REWARDS[chosenIdx];
    const numSlices = WHEEL_REWARDS.length;
    const sliceAngle = (Math.PI * 2) / numSlices;
    // Calculate target angle to point the top needle at this slice
    // Pointer is at top (-PI/2), so slice should align with -PI/2
    const targetSliceAngle = (Math.PI * 2) - (chosenIdx * sliceAngle + sliceAngle / 2) - Math.PI / 2;
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const finalAngle = wheelAngle + extraRounds * Math.PI * 2 + targetSliceAngle;

    const startTime = performance.now();
    const duration = 3800;
    const startAngle = wheelAngle;

    const animateWheel = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startAngle + (finalAngle - startAngle) * ease;
      setWheelAngle(current);

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        setIsSpinning(false);
        setWheelResult(chosenReward);
        sounds.playLevelUp();
        onSpinWheel(chosenReward, currentWheelCost);
      }
    };

    requestAnimationFrame(animateWheel);
  };

  const getTierBadge = (tier: ShopTier) => {
    switch (tier) {
      case 'common':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">PHỔ THÔNG</span>;
      case 'rare':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">HIẾM</span>;
      case 'epic':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">SỬ THI</span>;
      case 'legendary':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600 shadow-sm shadow-amber-500/20">TRUYỀN THUYẾT</span>;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#07090e] text-slate-200 select-none overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/25 via-[#07090e] to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-red-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnTitle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition cursor-pointer"
          >
            <span>← Menu Chính</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-base sm:text-lg font-bold text-amber-400">
              SẢNH CHỜ HOÀNG GIA
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 font-mono">
              · DOANH TRẠI AN TOÀN
            </span>
          </div>
        </div>

        {/* Currency & Audio & CTA */}
        <div className="flex items-center gap-3">
          {/* Gold Wallet */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono font-bold text-sm shadow-lg shadow-amber-500/10">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{gold.toLocaleString()} Vàng</span>
          </div>

          {/* Level Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-amber-400 font-bold font-mono">LV.{heroLevel}</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${expPct}%` }} />
            </div>
          </div>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Layout (Split Screen: Left Hero & Embark / Right Hub Tabs) */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-6 overflow-hidden">
        {/* Left Column: Hero Showcase & Fast Embark (4 cols on lg) */}
        <section className="lg:col-span-4 flex flex-col justify-between p-5 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-md overflow-y-auto">
          <div>
            {/* Class Title & Role */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[11px] font-bold text-amber-400 font-cinzel">CHIẾN TƯỚNG ĐANG CHỌN</span>
                <h2 className="font-cinzel text-xl font-black text-slate-100">{selectedHeroClass.name}</h2>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
                style={{
                  backgroundColor: selectedHeroClass.visuals.primaryColor,
                  borderColor: selectedHeroClass.visuals.secondaryColor,
                }}
              >
                <Shield className="w-5 h-5" style={{ color: selectedHeroClass.visuals.weaponGlow }} />
              </div>
            </div>

            {/* Quick Hero Setup Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={onOpenCharacterSelect}
                className="py-2 px-3 rounded-xl bg-sky-950/60 hover:bg-sky-900/70 border border-sky-800/60 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Đổi Tướng</span>
              </button>
              <button
                onClick={onOpenOutfits}
                className="py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800/60 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>Trang Phục</span>
              </button>
            </div>

            {/* Permanent Gear Equipped in Lobby */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 font-cinzel flex items-center justify-between">
                <span>TRANG BỊ SẢNH CHỜ (VĨNH VIỄN)</span>
                <span className="text-[10px] text-amber-400 font-normal">Giữ nguyên qua các map</span>
              </div>

              {/* Weapon Slot */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Swords className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {lobbyEquipment.weapon ? lobbyEquipment.weapon.name : 'Chưa trang bị vũ khí'}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono">
                      {lobbyEquipment.weapon ? `+${lobbyEquipment.weapon.stats.atk} ATK · +${lobbyEquipment.weapon.stats.hp} HP` : 'Mua tại Tiệm Binh Khí'}
                    </div>
                  </div>
                </div>
                {lobbyEquipment.weapon && (
                  <button
                    onClick={() => onUnequipLobbyItem('weapon')}
                    className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-slate-900"
                  >
                    Tháo
                  </button>
                )}
              </div>

              {/* Armor Slot */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {lobbyEquipment.armor ? lobbyEquipment.armor.name : 'Chưa trang bị giáp trụ'}
                    </div>
                    <div className="text-[10px] text-sky-400 font-mono">
                      {lobbyEquipment.armor ? `+${lobbyEquipment.armor.stats.def} DEF · +${lobbyEquipment.armor.stats.hp} HP` : 'Mua tại Tiệm Binh Khí'}
                    </div>
                  </div>
                </div>
                {lobbyEquipment.armor && (
                  <button
                    onClick={() => onUnequipLobbyItem('armor')}
                    className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-slate-900"
                  >
                    Tháo
                  </button>
                )}
              </div>
            </div>

            {/* Total Hero Power Preview */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 font-cinzel">CHỈ SỐ XUẤT PHÁT MỖI MAP</span>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex justify-between">
                  <span className="text-red-400">HP:</span>
                  <strong className="text-slate-100">{heroStats.maxHp}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex justify-between">
                  <span className="text-amber-400">ATK:</span>
                  <strong className="text-slate-100">{heroStats.atk}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex justify-between">
                  <span className="text-blue-400">DEF:</span>
                  <strong className="text-slate-100">{heroStats.def}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex justify-between">
                  <span className="text-yellow-400">CRIT:</span>
                  <strong className="text-slate-100">{Math.round(heroStats.critRate * 100)}%</strong>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">
                *Khi vượt map mới, chỉ số hòm rương tạm thời sẽ reset về mốc xuất phát này.
              </p>
            </div>
          </div>

          {/* Primary Departure Embark Buttons */}
          <div className="mt-5 space-y-2">
            <button
              onClick={onStartGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-cinzel font-black text-base sm:text-lg tracking-wider shadow-xl shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Swords className="w-5 h-5" />
              <span>XUẤT CHIẾN NGAY</span>
            </button>

            <button
              onClick={onOpenMapSelect}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-cinzel font-bold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Chọn Cảnh Giới & Đấu Trường</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Right Column: Hub Tabs (Shop, Quests, Lucky Wheel) (8 cols on lg) */}
        <section className="lg:col-span-8 flex flex-col rounded-3xl bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/50">
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-4 py-2.5 rounded-xl font-cinzel text-xs sm:text-sm font-bold tracking-wider transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'shop'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>TIỆM BINH KHÍ & GIÁP</span>
            </button>

            <button
              onClick={() => setActiveTab('quests')}
              className={`px-4 py-2.5 rounded-xl font-cinzel text-xs sm:text-sm font-bold tracking-wider transition flex items-center gap-2 cursor-pointer relative ${
                activeTab === 'quests'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>BẢNG NHIỆM VỤ</span>
              {claimableQuestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold animate-pulse">
                  {claimableQuestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wheel')}
              className={`px-4 py-2.5 rounded-xl font-cinzel text-xs sm:text-sm font-bold tracking-wider transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'wheel'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>VÒNG QUAY MAY MẮN</span>
            </button>
          </div>

          {/* Tab 1: Shop */}
          {activeTab === 'shop' && (
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto flex flex-col">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setShopCategory('weapon')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      shopCategory === 'weapon' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Vũ Khí (8)
                  </button>
                  <button
                    onClick={() => setShopCategory('armor')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      shopCategory === 'armor' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Giáp Trụ (8)
                  </button>
                </div>

                {/* Tier Filter */}
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500 mr-1">Cấp bậc:</span>
                  {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setShopTierFilter(t)}
                      className={`px-2.5 py-1 rounded-lg font-mono capitalize transition cursor-pointer ${
                        shopTierFilter === t
                          ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t === 'all' ? 'Tất cả' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto">
                {filteredShopItems.map((item) => {
                  const isUnlocked = unlockedLobbyItems.includes(item.id);
                  const isEquipped =
                    (item.type === 'weapon' && lobbyEquipment.weapon?.id === item.id) ||
                    (item.type === 'armor' && lobbyEquipment.armor?.id === item.id);
                  const canAfford = gold >= item.cost;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                        isEquipped
                          ? 'border-amber-400 bg-slate-900/90 shadow-lg shadow-amber-500/10'
                          : isUnlocked
                          ? 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                          : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          {getTierBadge(item.tier)}
                          <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" />
                            {item.cost.toLocaleString()}
                          </span>
                        </div>

                        <h3 className="font-cinzel text-base font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{item.name}</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.description}</p>

                        {/* Stats list */}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono">
                          {item.stats.atk > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-300 font-bold">
                              +{item.stats.atk} ATK
                            </span>
                          )}
                          {item.stats.hp > 0 && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-bold">
                              +{item.stats.hp} HP
                            </span>
                          )}
                          {item.stats.def > 0 && (
                            <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300 font-bold">
                              +{item.stats.def} DEF
                            </span>
                          )}
                          {item.stats.critRate && (
                            <span className="px-2 py-0.5 rounded bg-yellow-950/60 border border-yellow-800/60 text-yellow-300 font-bold">
                              +{Math.round(item.stats.critRate * 100)}% BẠO
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        {isEquipped ? (
                          <div className="w-full py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold text-center">
                            ✓ ĐANG TRANG BỊ
                          </div>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => onEquipLobbyItem(item)}
                            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition cursor-pointer"
                          >
                            Trang Bị Món Này
                          </button>
                        ) : (
                          <button
                            onClick={() => onBuyLobbyItem(item)}
                            disabled={!canAfford}
                            className={`w-full py-2.5 rounded-xl font-cinzel text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              canAfford
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>MỞ KHÓA ({item.cost} XU)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Quests */}
          {activeTab === 'quests' && (
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
              <div className="mb-4">
                <h3 className="font-cinzel text-base font-bold text-purple-300">
                  NHIỆM VỤ TIỄN DIỆT MA QUÁI
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hoàn thành mục tiêu chiến đấu để thu hoạch Vàng và mở khóa thần khí trong Sảnh Chờ!
                </p>
              </div>

              <div className="space-y-3">
                {quests.map((q) => {
                  const pct = Math.min(100, Math.round((q.current / q.target) * 100));

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center flex-shrink-0 text-purple-300">
                          {q.metric === 'boss_kills' ? <Crown className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-cinzel text-sm font-bold text-slate-100">{q.title}</h4>
                            <span className="text-[11px] font-mono font-bold text-amber-400">
                              +{q.rewardGold} Vàng
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{q.description}</p>

                          {/* Progress Bar */}
                          <div className="flex items-center gap-2 mt-2 w-48 sm:w-64">
                            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  q.completed ? 'bg-emerald-500' : 'bg-purple-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {q.current}/{q.target}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="sm:self-center flex-shrink-0">
                        {q.claimed ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ĐÃ NHẬN</span>
                          </div>
                        ) : q.completed ? (
                          <button
                            onClick={() => onClaimQuestReward(q.id)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-cinzel font-bold text-xs tracking-wider shadow-lg shadow-emerald-600/30 transition cursor-pointer animate-bounce"
                          >
                            NHẬN THƯỞNG
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                            Đang tiến hành ({pct}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Lucky Wheel */}
          {activeTab === 'wheel' && (
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto flex flex-col items-center justify-center">
              <div className="text-center mb-3">
                <h3 className="font-cinzel text-lg font-black text-amber-400">
                  VÒNG QUAY MAY MẮN HOÀNG GIA
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                  Quay số nhận thần dược, rương báu, hoặc săn hũ vàng rực rỡ! Chi phí quay tăng dần theo từng lượt quay.
                </p>
              </div>

              {/* Wheel Container */}
              <div className="relative my-2 flex items-center justify-center">
                {/* Pointer needle on top */}
                <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-red-500 drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]" />

                <canvas
                  ref={wheelCanvasRef}
                  width={320}
                  height={320}
                  className="rounded-full shadow-2xl shadow-amber-500/20 max-w-[280px] sm:max-w-[320px] max-h-[280px] sm:max-h-[320px]"
                />
              </div>

              {/* Result Notice */}
              {wheelResult && (
                <div className="my-2 p-3 rounded-2xl bg-amber-950/80 border border-amber-500 text-center animate-in zoom-in-95 duration-200">
                  <span className="text-xs text-slate-300 font-semibold">Chúc Mừng Bạn Nhận Được:</span>
                  <div className="font-cinzel text-lg font-black text-amber-300 mt-0.5">
                    {wheelResult.label}
                  </div>
                </div>
              )}

              {/* Spin Action */}
              <div className="mt-3 flex flex-col items-center gap-2">
                <button
                  onClick={handleSpinClick}
                  disabled={isSpinning || gold < currentWheelCost}
                  className={`px-8 py-3.5 rounded-2xl font-cinzel font-black text-sm sm:text-base tracking-wider transition flex items-center gap-2 shadow-xl cursor-pointer ${
                    gold >= currentWheelCost && !isSpinning
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 shadow-amber-500/40 hover:scale-105 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isSpinning ? 'ĐANG QUAY...' : `QUAY NGAY (${currentWheelCost} VÀNG)`}
                  </span>
                </button>
                <span className="text-[11px] text-slate-500 font-mono">
                  Lượt quay hôm nay: {wheelSpins} · Giá lượt tiếp theo: {calculateWheelCost(wheelSpins + 1)} Vàng
                </span>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
