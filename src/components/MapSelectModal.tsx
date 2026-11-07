import React from 'react';
import { X, MapPin, Swords, Sparkles, Flame, Shield, ArrowRight, Skull, Moon, Coins } from 'lucide-react';
import { MapConfig, SpecialEvent } from '../game/types';
import { ADVENTURE_MAPS, ARENA_BATTLEGROUNDS, SPECIAL_EVENTS } from '../game/rules';

interface MapSelectModalProps {
  currentMapId: string;
  onSelectMap: (map: MapConfig, stageIndex?: number) => void;
  onSelectEvent: (event: SpecialEvent) => void;
  onClose: () => void;
}

export const MapSelectModal: React.FC<MapSelectModalProps> = ({
  currentMapId,
  onSelectMap,
  onSelectEvent,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<'adventure' | 'arena' | 'events'>('adventure');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-amber-400">
              CHỌN BẢN ĐỒ & ĐẤU TRƯỜNG
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng bản đồ"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('adventure')}
            className={`px-4 py-2 rounded-xl font-cinzel text-xs sm:text-sm font-bold tracking-wider transition flex items-center gap-2 ${
              activeTab === 'adventure'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>4 ĐẠI CẢNH GIỚI (20 ẢI / MAP)</span>
          </button>

          <button
            onClick={() => setActiveTab('arena')}
            className={`px-4 py-2 rounded-xl font-cinzel text-xs sm:text-sm font-bold tracking-wider transition flex items-center gap-2 ${
              activeTab === 'arena'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>ĐẤU TRƯỜNG SINH TỬ</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl font-cinzel text-xs sm:text-sm font-bold tracking-wider transition flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>SỰ KIỆN ĐẶC BIỆT</span>
          </button>
        </div>

        {/* Content Viewports */}
        <div className="pt-4 overflow-y-auto flex-1">
          {/* Tab 1: 4 Adventure Maps */}
          {activeTab === 'adventure' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ADVENTURE_MAPS.map((map, idx) => {
                const isCurrent = currentMapId === map.id;
                const bossStages = map.stages.filter((s) => s.isBossStage);
                const finalBoss = map.stages[map.stages.length - 1];

                return (
                  <div
                    key={map.id}
                    className={`flex flex-col justify-between p-5 rounded-2xl border-2 transition relative ${
                      isCurrent
                        ? 'border-amber-400 bg-slate-900/90 shadow-xl shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-slate-800 text-amber-300 font-cinzel border border-amber-500/30">
                          BẢN ĐỒ {idx + 1}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          20 ẢI (BOSS MỖI 5 ẢI)
                        </span>
                      </div>

                      <h3 className="font-cinzel text-xl font-bold text-slate-100">
                        {map.name}
                      </h3>
                      <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                        {map.subtitle}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        {map.description}
                      </p>

                      {/* Boss Milestones Pill */}
                      <div className="mt-3.5 p-2.5 rounded-xl bg-red-950/40 border border-red-900/50">
                        <div className="flex items-center gap-1.5 text-xs text-red-300 font-bold mb-1.5">
                          <Skull className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          <span>4 Trùm Khiêu Chiến (Ải 5 · 10 · 15 · 20):</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
                          {bossStages.map((b) => (
                            <div key={b.stageNumber} className="truncate">
                              <span className="text-amber-400 font-bold">Ải {b.stageNumber}:</span> {b.bossName}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 20 Stages progress dots */}
                      <div className="flex items-center gap-1 mt-3">
                        {map.stages.map((stg) => (
                          <div
                            key={stg.stageNumber}
                            title={`Ải ${stg.stageNumber}: ${stg.title}`}
                            className={`flex-1 h-1.5 rounded-full ${
                              stg.isBossStage ? 'bg-red-500 ring-1 ring-red-400' : 'bg-amber-500/50'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectMap(map, 0)}
                      className={`mt-5 w-full py-2.5 rounded-xl font-cinzel font-bold text-xs tracking-wider transition flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <span>{isCurrent ? 'ĐANG CHƠI' : 'VÀO BẢN ĐỒ'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Arena Battlegrounds */}
          {activeTab === 'arena' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ARENA_BATTLEGROUNDS.map((arena) => {
                const isCurrent = currentMapId === arena.id;

                return (
                  <div
                    key={arena.id}
                    className="p-5 rounded-2xl border-2 border-red-900/50 bg-slate-900/70 hover:bg-slate-900 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                          ĐẤU TRƯỜNG HUYẾT CHIẾN
                        </span>
                        <span className="text-xs text-amber-400 font-mono">5 Đợt Quái</span>
                      </div>

                      <h3 className="font-cinzel text-xl font-bold text-slate-100">
                        {arena.name}
                      </h3>
                      <p className="text-xs text-red-400 mt-0.5">{arena.subtitle}</p>
                      <p className="text-xs text-slate-400 mt-2">{arena.description}</p>
                    </div>

                    <button
                      onClick={() => onSelectMap(arena, 0)}
                      className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-cinzel font-bold text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-red-700/30"
                    >
                      <Swords className="w-4 h-4" />
                      <span>KHIÊU CHIẾN ĐẤU TRƯỜNG</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: Special Events */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SPECIAL_EVENTS.map((event) => (
                <div
                  key={event.id}
                  className="p-5 rounded-2xl border-2 border-purple-800/60 bg-slate-900/70 hover:bg-slate-900 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">
                        {event.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {event.durationText}
                      </span>
                    </div>

                    <h3 className="font-cinzel text-lg font-bold text-purple-300">
                      {event.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="mt-4 p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-amber-300 font-bold">
                      ⭐ {event.bonus}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectEvent(event)}
                    className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-cinzel font-bold text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>THAM GIA SỰ KIỆN</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
