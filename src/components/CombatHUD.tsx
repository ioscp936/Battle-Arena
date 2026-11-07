import React from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Backpack,
  Shirt,
  Map as MapIcon,
  Flame,
  Shield,
  Zap,
  Skull,
  Award,
  User,
  Home,
} from 'lucide-react';
import { ComboState, HeroClass, HeroStats, MapConfig, Monster, Outfit } from '../game/types';

interface CombatHUDProps {
  stats: HeroStats;
  combo: ComboState;
  boss: Monster | null;
  mapConfig: MapConfig;
  stageIndex: number;
  heroLevel: number;
  heroExp: number;
  expNext: number;
  gold: number;
  activeOutfit: Outfit;
  heroClass: HeroClass;
  monstersRemaining: number;
  cooldowns: {
    dash: number;
    whirlwind: number;
    inferno: number;
    ultimate: number;
  };
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenOutfits: () => void;
  onOpenCharacterSelect: () => void;
  onOpenMapSelect: () => void;
  onOpenLobby?: () => void;
  onPause: () => void;
  onTriggerSkill: (skillKey: 'attack' | 'dash' | 'whirlwind' | 'inferno' | 'ultimate') => void;
}

export const CombatHUD: React.FC<CombatHUDProps> = ({
  stats,
  combo,
  boss,
  mapConfig,
  stageIndex,
  heroLevel,
  heroExp,
  expNext,
  gold,
  activeOutfit,
  heroClass,
  monstersRemaining,
  cooldowns,
  isMuted,
  onToggleMute,
  onOpenInventory,
  onOpenOutfits,
  onOpenCharacterSelect,
  onOpenMapSelect,
  onOpenLobby,
  onPause,
  onTriggerSkill,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const furyPercent = Math.max(0, Math.min(100, (stats.fury / stats.maxFury) * 100));
  const expPercent = Math.max(0, Math.min(100, (heroExp / expNext) * 100));

  const currentStage = mapConfig.stages[stageIndex] || mapConfig.stages[0];

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 z-20">
      {/* Top Bar */}
      <div className="w-full flex items-start justify-between gap-4">
        {/* Hero Vitality & Level Cluster */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/85 p-2.5 rounded-2xl border border-slate-800 shadow-xl">
          {/* Level Badge & Avatar */}
          <div className="relative">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-inner"
              style={{
                backgroundColor: heroClass.visuals.primaryColor,
                borderColor: heroClass.visuals.secondaryColor,
              }}
            >
              <Shield className="w-7 h-7" style={{ color: heroClass.visuals.weaponGlow }} />
            </div>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px]">
              LV.{heroLevel}
            </div>
          </div>

          {/* Vitals Bars & Hero Class Title */}
          <div className="flex flex-col gap-1 w-48 sm:w-56">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 font-cinzel">
              <span className="truncate">{heroClass.name}</span>
              <span className="text-[10px] text-slate-400 font-normal">({heroClass.role.split(' ')[0]})</span>
            </div>

            {/* Health Bar */}
            <div className="flex items-center justify-between text-xs font-semibold px-0.5">
              <span className="text-red-400 flex items-center gap-1">
                <span>HP</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {stats.hp}/{stats.maxHp}
                </span>
              </span>
              <span className="text-slate-400 text-[10px]">{Math.round(hpPercent)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full transition-all duration-150"
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {/* Fury (Rage) Bar */}
            <div className="flex items-center justify-between text-[11px] font-semibold px-0.5">
              <span className="text-amber-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>NỘ KHÍ</span>
              </span>
              <span className="text-slate-400 text-[10px]">{Math.round(furyPercent)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  furyPercent >= 100
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse'
                    : 'bg-gradient-to-r from-amber-600 to-orange-400'
                }`}
                style={{ width: `${furyPercent}%` }}
              />
            </div>

            {/* EXP Bar */}
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-150"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Boss HP Bar (if active boss) */}
        {boss && boss.state !== 'dead' && (
          <div className="pointer-events-auto flex flex-col items-center w-full max-w-md mx-auto bg-slate-950/85 p-3 rounded-2xl border border-red-900/60 shadow-2xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between w-full px-2 mb-1">
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="font-cinzel text-sm sm:text-base font-black text-red-400 tracking-wide">
                  {boss.name.toUpperCase()}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 border border-red-700 text-red-300">
                {boss.bossPhase === 2 ? 'PHASE 2: CUỒNG NỘ' : 'PHASE 1'}
              </span>
            </div>

            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-red-700/80">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full transition-all duration-100"
                style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between w-full px-2 mt-0.5 text-[10px] text-slate-400 font-mono">
              <span>HP: {boss.hp}</span>
              <span>{Math.round((boss.hp / boss.maxHp) * 100)}%</span>
            </div>
          </div>
        )}

        {/* Top-Right Stage Info & Controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Stage & Currency Display */}
          <div className="flex items-center gap-3 bg-slate-950/85 px-3.5 py-2 rounded-xl border border-slate-800">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-amber-400 font-cinzel">
                {mapConfig.name}
              </span>
              <span className="text-[11px] text-slate-300">
                Ải {stageIndex + 1}/{mapConfig.stages.length} · <span className="text-amber-300 font-bold">{monstersRemaining}</span> Quái {currentStage?.isBossStage && <strong className="text-red-400">(BOSS)</strong>}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono text-xs">
              <span>🪙</span>
              <span>{gold}</span>
            </div>
          </div>

          {/* Action Tool Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={onOpenCharacterSelect}
              title="Đổi Tướng / Lớp Nhân Vật"
              aria-label="Chọn Tướng"
              className="p-2 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700/60 transition cursor-pointer"
            >
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenInventory}
              title="Túi Đồ & Trang Bị [B]"
              aria-label="Túi Đồ"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition cursor-pointer"
            >
              <Backpack className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenOutfits}
              title="Tủ Đồ Trang Phục [C]"
              aria-label="Trang Phục"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-purple-300 transition cursor-pointer"
            >
              <Shirt className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenMapSelect}
              title="Chọn Bản Đồ & Đấu Trường [M]"
              aria-label="Chọn Bản Đồ"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition cursor-pointer"
            >
              <MapIcon className="w-4 h-4" />
            </button>

            {onOpenLobby && (
              <button
                onClick={onOpenLobby}
                title="Sảnh Chờ & Cửa Hàng Vũ Khí"
                aria-label="Sảnh Chờ"
                className="p-2 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onToggleMute}
              title="Âm thanh"
              aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onPause}
              title="Tạm dừng [Esc / P]"
              aria-label="Tạm Dừng"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Left: Dynamic Combo Streak & Rank */}
      {combo.hits > 0 && (
        <div className="pointer-events-none flex flex-col items-start gap-1 my-auto ml-2 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-2">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-cinzel font-black text-2xl shadow-xl border-2 ${
                combo.rank === 'SSS'
                  ? 'bg-red-600 text-amber-200 border-yellow-300 shadow-red-600/50 animate-bounce'
                  : combo.rank === 'SS' || combo.rank === 'S'
                  ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-amber-500/40'
                  : 'bg-indigo-600 text-white border-indigo-300'
              }`}
            >
              {combo.rank}
            </div>

            <div className="flex flex-col">
              <span className="font-teko text-3xl font-bold tracking-wider text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none">
                {combo.hits} COMBO!
              </span>
              <span className="text-[11px] font-bold text-red-400 tracking-wider">
                +{Math.round((combo.multiplier - 1) * 100)}% SÁT THƯƠNG
              </span>
            </div>
          </div>

          <div className="w-32 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-amber-400 transition-all duration-75"
              style={{ width: `${(combo.timer / combo.maxTimer) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Bar: Class-Adaptive Action Skills Hotbar (PC Desktop View) */}
      <div className="hidden md:flex w-full items-end justify-between gap-4">
        {/* Monsters remaining indicator */}
        <div className="pointer-events-auto bg-slate-950/85 px-3 py-2 rounded-xl border border-slate-800 text-xs flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">
            Quái vật còn lại: <strong className="text-white font-mono text-sm">{monstersRemaining}</strong>
          </span>
        </div>

        {/* Center Skills Dock with Dynamic Class Skills */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 p-2 rounded-2xl border border-slate-800 shadow-2xl">
          {/* Basic Attack Slot */}
          <button
            onClick={() => onTriggerSkill('attack')}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600 hover:border-amber-400 flex flex-col items-center justify-center transition active:scale-95 group cursor-pointer"
          >
            <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
            <span className="text-[9px] text-slate-300 font-semibold mt-0.5 truncate max-w-[54px]">
              {heroClass.skills.basic.name}
            </span>
            <kbd className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-amber-300 font-mono font-bold">
              J
            </kbd>
          </button>

          {/* Skill 1 Slot */}
          <button
            onClick={() => onTriggerSkill('dash')}
            disabled={cooldowns.dash > 0}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600 hover:border-emerald-400 flex flex-col items-center justify-center transition active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer overflow-hidden"
          >
            <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-[9px] text-slate-300 font-semibold mt-0.5 truncate max-w-[54px]">
              {heroClass.skills.skill1.name}
            </span>
            <kbd className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-emerald-300 font-mono font-bold">
              Space
            </kbd>
            {cooldowns.dash > 0 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center font-bold text-white text-xs font-mono">
                {cooldowns.dash.toFixed(1)}s
              </div>
            )}
          </button>

          {/* Skill 2 Slot */}
          <button
            onClick={() => onTriggerSkill('whirlwind')}
            disabled={cooldowns.whirlwind > 0}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600 hover:border-sky-400 flex flex-col items-center justify-center transition active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer overflow-hidden"
          >
            <div className="text-lg">✨</div>
            <span className="text-[9px] text-slate-300 font-semibold mt-0.5 truncate max-w-[54px]">
              {heroClass.skills.skill2.name}
            </span>
            <kbd className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-sky-300 font-mono font-bold">
              L
            </kbd>
            {cooldowns.whirlwind > 0 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center font-bold text-white text-xs font-mono">
                {cooldowns.whirlwind.toFixed(1)}s
              </div>
            )}
          </button>

          {/* Skill 3 Slot */}
          <button
            onClick={() => onTriggerSkill('inferno')}
            disabled={cooldowns.inferno > 0}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600 hover:border-orange-500 flex flex-col items-center justify-center transition active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer overflow-hidden"
          >
            <Flame className="w-5 h-5 text-orange-500 group-hover:scale-110 transition" />
            <span className="text-[9px] text-slate-300 font-semibold mt-0.5 truncate max-w-[54px]">
              {heroClass.skills.skill3.name}
            </span>
            <kbd className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-orange-300 font-mono font-bold">
              I
            </kbd>
            {cooldowns.inferno > 0 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center font-bold text-white text-xs font-mono">
                {cooldowns.inferno.toFixed(1)}s
              </div>
            )}
          </button>

          {/* Ultimate Slot */}
          <button
            onClick={() => onTriggerSkill('ultimate')}
            disabled={stats.fury < 100 || cooldowns.ultimate > 0}
            className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl flex flex-col items-center justify-center transition active:scale-95 cursor-pointer overflow-hidden border-2 ${
              stats.fury >= 100 && cooldowns.ultimate <= 0
                ? 'bg-gradient-to-br from-purple-900 via-red-900 to-amber-700 border-amber-400 shadow-xl shadow-red-600/50 animate-pulse'
                : 'bg-slate-900 border-slate-700 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="text-xl">⚡</div>
            <span className="text-[9px] text-amber-300 font-bold font-cinzel mt-0.5 truncate max-w-[62px]">
              {heroClass.skills.ultimate.name}
            </span>
            <kbd className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded bg-amber-500 border border-amber-300 text-[10px] text-slate-950 font-mono font-black">
              U
            </kbd>
            {cooldowns.ultimate > 0 && (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center font-bold text-white text-xs font-mono">
                {cooldowns.ultimate.toFixed(1)}s
              </div>
            )}
          </button>
        </div>

        {/* Quick Helper Hint */}
        <div className="hidden md:flex pointer-events-auto bg-slate-950/85 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-400">
          <span>B: Túi đồ · C: Trang phục · M: Bản đồ</span>
        </div>
      </div>
    </div>
  );
};
