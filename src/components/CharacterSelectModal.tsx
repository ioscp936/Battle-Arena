import React from 'react';
import { X, Check, Swords, Sparkles, Shield, Zap, Flame, Snowflake, Crosshair, Heart, ArrowRight } from 'lucide-react';
import { HeroClass, HeroClassId } from '../game/types';
import { HERO_CLASSES } from '../game/rules';

interface CharacterSelectModalProps {
  currentClassId: HeroClassId;
  onSelectClass: (heroClass: HeroClass) => void;
  onClose: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  currentClassId,
  onSelectClass,
  onClose,
}) => {
  const [selectedClassId, setSelectedClassId] = React.useState<HeroClassId>(currentClassId);
  const selected = HERO_CLASSES.find((c) => c.id === selectedClassId) || HERO_CLASSES[0];

  const getClassIcon = (modelType: string) => {
    switch (modelType) {
      case 'warrior': return <Swords className="w-6 h-6 text-red-500" />;
      case 'mage': return <Sparkles className="w-6 h-6 text-sky-400" />;
      case 'assassin': return <Zap className="w-6 h-6 text-emerald-400" />;
      case 'ranger': return <Crosshair className="w-6 h-6 text-lime-400" />;
      case 'paladin': return <Shield className="w-6 h-6 text-amber-400" />;
      default: return <Swords className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-red-400 to-purple-400">
              TUYỂN CHỌN TƯỚNG & HỆ SỨC MẠNH
            </h2>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>5 Lớp Nhân Vật Sở Hữu Kỹ Năng Độc Quyền</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng chọn tướng"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left Class List (5 cols) + Right Detail & Skills (7 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 overflow-y-auto flex-1">
          {/* Class List */}
          <div className="md:col-span-5 flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-cinzel">
              Chọn Dũng Sĩ ({HERO_CLASSES.length})
            </h3>

            <div className="flex flex-col gap-2.5">
              {HERO_CLASSES.map((cls) => {
                const isSelected = selectedClassId === cls.id;
                const isCurrentActive = currentClassId === cls.id;

                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-slate-900 shadow-lg shadow-amber-500/15'
                        : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-13 h-13 rounded-xl flex items-center justify-center border shadow-inner flex-shrink-0"
                      style={{
                        backgroundColor: cls.visuals.primaryColor,
                        borderColor: cls.visuals.secondaryColor,
                      }}
                    >
                      {getClassIcon(cls.visuals.modelType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100 font-cinzel truncate">
                          {cls.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                          {cls.difficulty}
                        </span>
                      </div>
                      <span className="text-xs text-amber-400/90 font-medium block truncate">
                        {cls.role}
                      </span>
                    </div>

                    {isCurrentActive && (
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[9px] flex-shrink-0 font-mono">
                        ĐANG DÙNG
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Skill Tree & Showcase */}
          <div className="md:col-span-7 flex flex-col gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
            {/* Visual Showcase Card */}
            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-2xl flex-shrink-0"
                style={{
                  backgroundColor: selected.visuals.primaryColor,
                  borderColor: selected.visuals.secondaryColor,
                  boxShadow: `0 0 20px ${selected.visuals.auraColor}`,
                }}
              >
                {getClassIcon(selected.visuals.modelType)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-cinzel text-lg font-black text-amber-300">
                    {selected.name}
                  </h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Vũ Khí: {selected.weaponName}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {selected.description}
                </p>
              </div>
            </div>

            {/* Exclusive 4 Skills Breakdown */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-cinzel">
                Bộ Kỹ Năng Độc Quyền
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Basic Attack */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    J
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">
                      {selected.skills.basic.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selected.skills.basic.description}
                    </span>
                  </div>
                </div>

                {/* Skill 1 (Space) */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    Space
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">
                      {selected.skills.skill1.name} ({selected.skills.skill1.cooldown}s)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selected.skills.skill1.description}
                    </span>
                  </div>
                </div>

                {/* Skill 2 (L) */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    L
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">
                      {selected.skills.skill2.name} ({selected.skills.skill2.cooldown}s)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selected.skills.skill2.description}
                    </span>
                  </div>
                </div>

                {/* Skill 3 (I) */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    I
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">
                      {selected.skills.skill3.name} ({selected.skills.skill3.cooldown}s)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selected.skills.skill3.description}
                    </span>
                  </div>
                </div>

                {/* Ultimate (U) */}
                <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-purple-950/60 to-red-950/60 p-2.5 rounded-xl border border-purple-700/60 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    U
                  </div>
                  <div>
                    <span className="font-bold text-amber-300 block font-cinzel">
                      {selected.skills.ultimate.name} (CHIÊU CUỐI)
                    </span>
                    <span className="text-[11px] text-slate-300">
                      {selected.skills.ultimate.description}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Select CTA Button */}
            <button
              onClick={() => {
                onSelectClass(selected);
                onClose();
              }}
              className="mt-auto w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-slate-950 font-cinzel font-black text-sm tracking-wider shadow-xl shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>CHỌN TƯỚNG NÀY XUẤT CHIẾN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
