import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Swords,
  Wind,
  Flame,
  Zap,
  Shield,
  Sparkles,
  Snowflake,
  Crosshair,
  CloudRain,
  Sun,
  Heart,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { HeroClass } from '../game/types';

interface TouchControlsProps {
  heroClass: HeroClass;
  fury: number;
  cooldowns: {
    dash: number;
    whirlwind: number;
    inferno: number;
    ultimate: number;
  };
  onJoystickMove: (dx: number, dy: number) => void;
  onTriggerSkill: (skillKey: 'attack' | 'dash' | 'whirlwind' | 'inferno' | 'ultimate') => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  heroClass,
  fury,
  cooldowns,
  onJoystickMove,
  onTriggerSkill,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);
  const activeTouchIdRef = useRef<number | null>(null);

  // Core movement calculation from client coordinates
  const processMovement = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystickBaseRef.current) return;
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxDist = rect.width / 2 - 10;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Deadzone to avoid jitter when resting at center
      if (dist < 6) {
        setKnobPos({ x: 0, y: 0 });
        onJoystickMove(0, 0);
        return;
      }

      // Clamp knob movement to circular perimeter
      let knobX = dx;
      let knobY = dy;
      if (dist > maxDist) {
        knobX = (dx / dist) * maxDist;
        knobY = (dy / dist) * maxDist;
      }

      setKnobPos({ x: knobX, y: knobY });

      // Normalized vector (-1 to 1) for GameEngine
      const normX = Math.max(-1, Math.min(1, dx / maxDist));
      const normY = Math.max(-1, Math.min(1, dy / maxDist));
      onJoystickMove(normX, normY);
    },
    [onJoystickMove]
  );

  // Reset joystick back to center
  const resetJoystick = useCallback(() => {
    activePointerIdRef.current = null;
    activeTouchIdRef.current = null;
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  }, [onJoystickMove]);

  // Pointer event handlers (Universal for mobile touch + stylus + mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    activePointerIdRef.current = e.pointerId;
    setIsDragging(true);
    processMovement(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    processMovement(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      resetJoystick();
    }
  };

  // Touch event handlers with multi-touch isolation via identifier
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTouchIdRef.current === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      activeTouchIdRef.current = touch.identifier;
      setIsDragging(true);
      processMovement(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTouchIdRef.current === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === activeTouchIdRef.current) {
        processMovement(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchIdRef.current) {
        resetJoystick();
        break;
      }
    }
  };

  // Direct cardinal tap handlers for quick directional moves
  const handleCardinalPress = (dirX: number, dirY: number) => {
    setIsDragging(true);
    setKnobPos({ x: dirX * 42, y: dirY * 42 });
    onJoystickMove(dirX, dirY);
  };

  // Global window failsafe: if pointer is released anywhere outside the container
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (activePointerIdRef.current !== null || activeTouchIdRef.current !== null) {
        resetJoystick();
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    window.addEventListener('touchcancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
      window.removeEventListener('touchcancel', handleGlobalPointerUp);
    };
  }, [resetJoystick]);

  // Skill icon helper
  const getSkillIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Flame': return <Flame className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Snowflake': return <Snowflake className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Sun': return <Sun className={className} />;
      case 'Crosshair': return <Crosshair className={className} />;
      case 'CloudRain': return <CloudRain className={className} />;
      case 'Heart': return <Heart className={className} />;
      case 'Shield': return <Shield className={className} />;
      default: return <Wind className={className} />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none flex justify-between items-end p-3 sm:p-6 pb-4 sm:pb-6">
      {/* Virtual Joystick (Bottom Left Touch Zone) */}
      <div className="pointer-events-auto relative flex flex-col items-center">
        {/* Joystick Base Circle with Analog & D-pad Support */}
        <div
          ref={joystickBaseRef}
          role="slider"
          aria-label="Cần điều khiển di chuyển"
          aria-valuetext={isDragging ? 'Đang di chuyển' : 'Đứng yên'}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: 'none' }}
          className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-slate-950/80 border-2 ${
            isDragging ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)]' : 'border-slate-700/80 shadow-2xl'
          } backdrop-blur-md flex items-center justify-center transition-colors cursor-grab active:cursor-grabbing select-none`}
        >
          {/* Cardinal Direction Buttons (Lên, Xuống, Trái, Phải) */}
          <button
            type="button"
            aria-label="Di chuyển lên"
            onPointerDown={(e) => {
              e.stopPropagation();
              handleCardinalPress(0, -1);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              resetJoystick();
            }}
            className="absolute top-1 w-10 h-8 flex items-center justify-center text-amber-400/80 hover:text-amber-300 active:scale-125 transition-transform"
          >
            <ChevronUp className="w-5 h-5 drop-shadow" />
          </button>

          <button
            type="button"
            aria-label="Di chuyển xuống"
            onPointerDown={(e) => {
              e.stopPropagation();
              handleCardinalPress(0, 1);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              resetJoystick();
            }}
            className="absolute bottom-1 w-10 h-8 flex items-center justify-center text-amber-400/80 hover:text-amber-300 active:scale-125 transition-transform"
          >
            <ChevronDown className="w-5 h-5 drop-shadow" />
          </button>

          <button
            type="button"
            aria-label="Di chuyển sang trái"
            onPointerDown={(e) => {
              e.stopPropagation();
              handleCardinalPress(-1, 0);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              resetJoystick();
            }}
            className="absolute left-1 w-8 h-10 flex items-center justify-center text-amber-400/80 hover:text-amber-300 active:scale-125 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 drop-shadow" />
          </button>

          <button
            type="button"
            aria-label="Di chuyển sang phải"
            onPointerDown={(e) => {
              e.stopPropagation();
              handleCardinalPress(1, 0);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              resetJoystick();
            }}
            className="absolute right-1 w-8 h-10 flex items-center justify-center text-amber-400/80 hover:text-amber-300 active:scale-125 transition-transform"
          >
            <ChevronRight className="w-5 h-5 drop-shadow" />
          </button>

          {/* Concentric Guide Rings */}
          <div className="absolute inset-4 rounded-full border border-dashed border-slate-600/50 pointer-events-none" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400/70 pointer-events-none" />

          {/* Central Thumb Knob */}
          <div
            className={`pointer-events-none w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 border-2 border-amber-200 shadow-xl flex items-center justify-center transition-transform ${
              isDragging ? 'scale-110 shadow-amber-400/80' : 'shadow-amber-500/40'
            }`}
            style={{
              transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
              willChange: 'transform',
            }}
          >
            <div className="w-6 h-6 rounded-full bg-slate-950/50 border border-amber-300/60 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-200" />
            </div>
          </div>
        </div>

        {/* Small Mobile Hint */}
        <span className="text-[10px] text-slate-400/90 font-medium mt-1 pointer-events-none">
          {isDragging ? 'Đang Di Chuyển' : 'Chạm & Kéo Di Chuyển'}
        </span>
      </div>

      {/* Combat Skill Cluster (Bottom Right) */}
      <div className="pointer-events-auto relative flex flex-col items-end gap-2.5 pb-1">
        {/* Top Arc Skills (Skill 2, Skill 3, Ultimate) */}
        <div className="flex items-center gap-2.5 mr-1">
          {/* Skill 2 */}
          <div className="relative">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onTriggerSkill('whirlwind');
              }}
              disabled={cooldowns.whirlwind > 0}
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition active:scale-95 touch-manipulation cursor-pointer ${
                cooldowns.whirlwind > 0
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-gradient-to-br from-sky-600 to-blue-700 border-sky-400 text-white shadow-sky-600/40'
              }`}
              style={{ minWidth: '48px', minHeight: '48px', touchAction: 'none' }}
              aria-label={heroClass.skills.skill2.name}
            >
              {getSkillIcon(heroClass.skills.skill2.icon, 'w-5 h-5')}
              <span className="text-[8px] font-bold mt-0.5 tracking-tighter truncate max-w-[42px]">
                {cooldowns.whirlwind > 0 ? cooldowns.whirlwind.toFixed(1) : heroClass.skills.skill2.name.slice(0, 4)}
              </span>
            </button>
            {cooldowns.whirlwind > 0 && (
              <div className="absolute inset-0 rounded-full bg-black/60 pointer-events-none flex items-center justify-center text-xs font-bold font-mono text-white">
                {cooldowns.whirlwind.toFixed(1)}s
              </div>
            )}
          </div>

          {/* Skill 3 */}
          <div className="relative">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onTriggerSkill('inferno');
              }}
              disabled={cooldowns.inferno > 0}
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition active:scale-95 touch-manipulation cursor-pointer ${
                cooldowns.inferno > 0
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-400 text-white shadow-purple-600/40'
              }`}
              style={{ minWidth: '48px', minHeight: '48px', touchAction: 'none' }}
              aria-label={heroClass.skills.skill3.name}
            >
              {getSkillIcon(heroClass.skills.skill3.icon, 'w-5 h-5')}
              <span className="text-[8px] font-bold mt-0.5 tracking-tighter truncate max-w-[42px]">
                {cooldowns.inferno > 0 ? cooldowns.inferno.toFixed(1) : heroClass.skills.skill3.name.slice(0, 4)}
              </span>
            </button>
            {cooldowns.inferno > 0 && (
              <div className="absolute inset-0 rounded-full bg-black/60 pointer-events-none flex items-center justify-center text-xs font-bold font-mono text-white">
                {cooldowns.inferno.toFixed(1)}s
              </div>
            )}
          </div>

          {/* Ultimate (Rage Skill) */}
          <div className="relative">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onTriggerSkill('ultimate');
              }}
              disabled={cooldowns.ultimate > 0 || fury < 100}
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-xl transition active:scale-95 touch-manipulation cursor-pointer ${
                fury >= 100 && cooldowns.ultimate <= 0
                  ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 border-yellow-300 text-slate-950 shadow-orange-500/60 animate-pulse'
                  : 'bg-slate-900/90 border-slate-700 text-slate-500'
              }`}
              style={{ minWidth: '56px', minHeight: '56px', touchAction: 'none' }}
              aria-label="Chiêu Cuối Ultimate"
            >
              <Zap className={`w-5 h-5 ${fury >= 100 ? 'fill-slate-950' : ''}`} />
              <span className="text-[9px] font-black font-cinzel tracking-wider">
                {fury >= 100 ? 'ULTI!' : `${Math.round(fury)}%`}
              </span>
            </button>
            {cooldowns.ultimate > 0 && (
              <div className="absolute inset-0 rounded-full bg-black/70 pointer-events-none flex items-center justify-center text-xs font-bold font-mono text-amber-300">
                {cooldowns.ultimate.toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        {/* Bottom Pair: Dash + Giant Primary Attack */}
        <div className="flex items-center gap-3">
          {/* Dash / Dodge Button */}
          <div className="relative">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onTriggerSkill('dash');
              }}
              disabled={cooldowns.dash > 0}
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition active:scale-95 touch-manipulation cursor-pointer ${
                cooldowns.dash > 0
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400 text-white shadow-emerald-600/40'
              }`}
              style={{ minWidth: '56px', minHeight: '56px', touchAction: 'none' }}
              aria-label="Lướt Né Đòn"
            >
              <Wind className="w-5 h-5" />
              <span className="text-[9px] font-bold">LƯỚT</span>
            </button>
            {cooldowns.dash > 0 && (
              <div className="absolute inset-0 rounded-full bg-black/60 pointer-events-none flex items-center justify-center text-xs font-bold font-mono text-white">
                {cooldowns.dash.toFixed(1)}
              </div>
            )}
          </div>

          {/* Primary Attack Button (Large Thumb Target) */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onTriggerSkill('attack');
            }}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 border-3 border-amber-300 text-slate-950 font-black shadow-2xl shadow-red-600/50 flex flex-col items-center justify-center active:scale-95 transition-transform touch-manipulation cursor-pointer"
            style={{ minWidth: '72px', minHeight: '72px', touchAction: 'none' }}
            aria-label="Đánh Thường"
          >
            <Swords className="w-8 h-8 text-white drop-shadow-md" />
            <span className="text-[10px] font-bold text-white tracking-wider font-cinzel">ĐÁNH</span>
          </button>
        </div>
      </div>
    </div>
  );
};
