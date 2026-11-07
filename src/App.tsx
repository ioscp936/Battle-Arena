import React, { useEffect, useRef, useState } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { CombatHUD } from './components/CombatHUD';
import { ChestRewardModal } from './components/ChestRewardModal';
import { InventoryModal } from './components/InventoryModal';
import { OutfitsModal } from './components/OutfitsModal';
import { MapSelectModal } from './components/MapSelectModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { LobbyView } from './components/LobbyView';
import { TouchControls } from './components/TouchControls';
import { GameEngine } from './game/engine';
import {
  ChestEntity,
  ComboState,
  HeroClass,
  HeroEquipment,
  HeroStats,
  Item,
  LobbyEquipment,
  LobbyItem,
  MapConfig,
  Monster,
  Outfit,
  QuestItem,
  SpecialEvent,
  WheelReward,
} from './game/types';
import {
  ADVENTURE_MAPS,
  applyHeroStats,
  calculateWheelCost,
  checkLevelUp,
  createDefaultEquipment,
  createDefaultOutfits,
  generateLootItem,
  HERO_CLASSES,
  INITIAL_QUESTS,
  LOBBY_SHOP_ARMORS,
  LOBBY_SHOP_WEAPONS,
  resetInRunEquipment,
} from './game/rules';
import { sounds } from './game/audio';

export default function App() {
  // Game states: 'title' | 'lobby' | 'playing' | 'paused' | 'gameover'
  const [gameState, setGameState] = useState<'title' | 'lobby' | 'playing' | 'paused' | 'gameover'>('title');

  // Overlays & Modals
  const [showInventory, setShowInventory] = useState(false);
  const [showOutfits, setShowOutfits] = useState(false);
  const [showMapSelect, setShowMapSelect] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [activeChest, setActiveChest] = useState<ChestEntity | null>(null);

  // Audio mute
  const [isMuted, setIsMuted] = useState(false);

  // Selected Hero Class (Warrior, Mage, Assassin, Ranger, Paladin)
  const [selectedHeroClass, setSelectedHeroClass] = useState<HeroClass>(HERO_CLASSES[0]);

  // Map & Stage
  const [currentMap, setCurrentMap] = useState<MapConfig>(ADVENTURE_MAPS[0]);
  const [stageIndex, setStageIndex] = useState(0);

  // Hero progression & economy
  const [heroLevel, setHeroLevel] = useState(1);
  const [heroExp, setHeroExp] = useState(0);
  const [expNext, setExpNext] = useState(140);
  const [gold, setGold] = useState(250); // initial purse
  const [outfits, setOutfits] = useState<Outfit[]>(createDefaultOutfits);
  const [activeOutfitId, setActiveOutfitId] = useState<string>('outfit_dark_knight');

  // Permanent Sảnh Chờ Equipment & Unlocks
  const [lobbyEquipment, setLobbyEquipment] = useState<LobbyEquipment>(() => ({
    weapon: LOBBY_SHOP_WEAPONS[0],
    armor: LOBBY_SHOP_ARMORS[0],
  }));
  const [unlockedLobbyItems, setUnlockedLobbyItems] = useState<string[]>([
    LOBBY_SHOP_WEAPONS[0].id,
    LOBBY_SHOP_ARMORS[0].id,
  ]);
  const [quests, setQuests] = useState<QuestItem[]>(() => INITIAL_QUESTS);
  const [wheelSpins, setWheelSpins] = useState<number>(0);

  // In-run Equipment & Inventory (Chest drops reset per map)
  const [equipment, setEquipment] = useState<HeroEquipment>(createDefaultEquipment);
  const [inventory, setInventory] = useState<Item[]>([
    generateLootItem('ring', 'rare', 1),
    generateLootItem('relic', 'rare', 1),
    generateLootItem('weapon', 'rare', 2),
  ]);

  // Derived Hero Stats (Base 250 HP, 20 ATK at level 1 with starter gear)
  const activeOutfit = outfits.find((o) => o.id === activeOutfitId) || outfits[0];
  const [heroStats, setHeroStats] = useState<HeroStats>(() =>
    applyHeroStats(1, createDefaultEquipment(), outfits[0], HERO_CLASSES[0], {
      weapon: LOBBY_SHOP_WEAPONS[0],
      armor: LOBBY_SHOP_ARMORS[0],
    })
  );

  // Live in-game telemetry
  const [boss, setBoss] = useState<Monster | null>(null);
  const [monstersRemaining, setMonstersRemaining] = useState(0);
  const [combo, setCombo] = useState<ComboState>({
    hits: 0,
    maxHits: 0,
    rank: 'D',
    multiplier: 1.0,
    timer: 0,
    maxTimer: 3.5,
    totalDamage: 0,
  });
  const [cooldowns, setCooldowns] = useState({
    dash: 0,
    whirlwind: 0,
    inferno: 0,
    ultimate: 0,
  });

  // End of run stats
  const [gameOverStats, setGameOverStats] = useState({
    stageNumber: 1,
    maxCombo: 0,
    totalKills: 0,
  });

  // Engine ref & canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Sync state to body dataset for ultra-mode verification
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Check URL autostart (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame();
    }
  }, []);

  // Update hero stats when equipment, level, outfit, hero class, or lobby equipment changes
  useEffect(() => {
    const calculated = applyHeroStats(heroLevel, equipment, activeOutfit, selectedHeroClass, lobbyEquipment);
    setHeroStats((prev) => ({
      ...calculated,
      hp: Math.min(calculated.maxHp, prev.hp || calculated.maxHp),
      fury: prev.fury || 0,
    }));
    if (engineRef.current) {
      engineRef.current.heroStats = calculated;
      engineRef.current.heroEquipment = equipment;
      engineRef.current.activeOutfit = activeOutfit;
      engineRef.current.heroClass = selectedHeroClass;
      engineRef.current.heroLevel = heroLevel;
    }
  }, [equipment, heroLevel, activeOutfitId, selectedHeroClass, lobbyEquipment]);

  // Helper to update quest metrics
  const updateQuestProgress = (metric: QuestItem['metric'], amount: number = 1) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.metric === metric && !q.completed) {
          const nextCurrent = q.current + amount;
          const isNowCompleted = nextCurrent >= q.target;
          return {
            ...q,
            current: Math.min(q.target, nextCurrent),
            completed: isNowCompleted,
          };
        }
        return q;
      })
    );
  };

  // Initialize or restart engine
  const initEngine = (map: MapConfig, stage: number, classToUse?: HeroClass) => {
    if (!canvasRef.current) return;

    if (engineRef.current) {
      engineRef.current.stop();
    }

    const cls = classToUse || selectedHeroClass;
    const calculatedStats = applyHeroStats(heroLevel, equipment, activeOutfit, cls, lobbyEquipment);
    calculatedStats.hp = calculatedStats.maxHp;
    calculatedStats.fury = 0;
    setHeroStats({ ...calculatedStats });

    const engine = new GameEngine(
      canvasRef.current,
      map,
      stage,
      calculatedStats,
      equipment,
      activeOutfit,
      cls,
      heroLevel,
      heroExp,
      {
        onHeroStatsChange: (newStats) => {
          setHeroStats({ ...newStats });
        },
        onComboChange: (newCombo) => {
          setCombo({ ...newCombo });
          if (newCombo.rank === 'S' || newCombo.rank === 'SS' || newCombo.rank === 'SSS') {
            updateQuestProgress('combo_rank', 1);
          }
        },
        onBossHpChange: (newBoss) => {
          setBoss(newBoss ? { ...newBoss } : null);
        },
        onStageClear: (chest) => {
          setActiveChest(chest);
          updateQuestProgress('wave_cleared', 1);
        },
        onGameOver: (runStats) => {
          setGameOverStats(runStats);
          setGameState('gameover');
        },
        onChestInteract: (chest) => {
          setActiveChest(chest);
        },
        onSkillCooldownsChange: (cds) => {
          setCooldowns(cds);
        },
        onLevelExpChange: (level, exp, _expReq, goldGained) => {
          setGold((prev) => prev + goldGained);
          const levelCheck = checkLevelUp(exp, level);
          if (levelCheck.leveledUp) {
            setHeroLevel(levelCheck.newLevel);
            setHeroExp(levelCheck.remainingExp);
            sounds.playLevelUp();
          } else {
            setHeroExp(exp);
          }
        },
        onMonsterKilled: (isBoss) => {
          updateQuestProgress('kills', 1);
          if (isBoss) {
            updateQuestProgress('boss_kills', 1);
          }
        },
        onSkillUsed: (skill) => {
          if (skill === 'dash') {
            updateQuestProgress('dashes', 1);
          } else if (skill === 'ultimate') {
            updateQuestProgress('ultimates', 1);
          }
        },
      }
    );

    engineRef.current = engine;
    engine.start();
  };

  // Canvas resize listener
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Poll monsters count for HUD
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      if (engineRef.current) {
        const alive = engineRef.current.monsters.filter((m) => m.state !== 'dead').length;
        setMonstersRemaining(alive);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [gameState]);

  // Global Keyboard listener (PC controls)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && gameState === 'playing') {
        setShowMapSelect((prev) => !prev);
        return;
      }
      if (e.code === 'KeyB' && gameState === 'playing') {
        setShowInventory((prev) => !prev);
        return;
      }
      if (e.code === 'KeyC' && gameState === 'playing') {
        setShowOutfits((prev) => !prev);
        return;
      }
      if ((e.code === 'Escape' || e.code === 'KeyP') && gameState === 'playing') {
        togglePause();
        return;
      }
      if ((e.code === 'Enter' || e.code === 'Space') && gameState === 'title') {
        setGameState('lobby');
        return;
      }

      // Pass keys to engine
      if (gameState === 'playing' && engineRef.current) {
        engineRef.current.handleKeyDown(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState === 'playing' && engineRef.current) {
        engineRef.current.handleKeyUp(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setStageIndex(0);
    setActiveChest(null);
    setShowInventory(false);
    setShowOutfits(false);
    setShowMapSelect(false);
    setShowCharacterSelect(false);
    initEngine(currentMap, 0);
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
      engineRef.current?.setPaused(true);
    } else if (gameState === 'paused') {
      setGameState('playing');
      engineRef.current?.setPaused(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  // Next stage progression
  const handleNextStage = () => {
    if (activeChest) {
      setInventory((prev) => [...prev, ...activeChest.items]);
      setGold((prev) => prev + activeChest.gold);
      setActiveChest(null);
      updateQuestProgress('chests_opened', 1);
    }

    const nextIndex = stageIndex + 1;
    if (nextIndex < currentMap.stages.length) {
      setStageIndex(nextIndex);
      initEngine(currentMap, nextIndex);
    } else {
      // Completed all 20 stages of the current map!
      if (currentMap.id === 'map_lava') {
        setOutfits((prev) =>
          prev.map((o) => (o.id === 'outfit_crimson_dragon' ? { ...o, unlocked: true } : o))
        );
      } else if (currentMap.id === 'map_frost') {
        setOutfits((prev) =>
          prev.map((o) => (o.id === 'outfit_frost_lord' ? { ...o, unlocked: true } : o))
        );
      }
      const currentMapIdx = ADVENTURE_MAPS.findIndex((m) => m.id === currentMap.id);
      const nextMap = ADVENTURE_MAPS[(currentMapIdx + 1) % ADVENTURE_MAPS.length];
      
      // RESET IN-RUN CHEST STATS WHEN CROSSING TO NEW MAP!
      const resetGear = resetInRunEquipment();
      setEquipment(resetGear);

      setCurrentMap(nextMap);
      setStageIndex(0);
      initEngine(nextMap, 0);
    }
  };

  // Equip in-run item (from chest)
  const handleEquipItem = (item: Item) => {
    setEquipment((prev) => {
      const slot = item.type as keyof HeroEquipment;
      const prevItem = prev[slot];
      if (prevItem) {
        setInventory((inv) => [...inv.filter((i) => i.id !== item.id), prevItem]);
      } else {
        setInventory((inv) => inv.filter((i) => i.id !== item.id));
      }
      return { ...prev, [slot]: item };
    });
  };

  // Unequip in-run item
  const handleUnequipItem = (slot: keyof HeroEquipment) => {
    setEquipment((prev) => {
      const item = prev[slot];
      if (item) {
        setInventory((inv) => [...inv, item]);
      }
      return { ...prev, [slot]: null };
    });
  };

  // Upgrade item
  const handleUpgradeItem = (item: Item) => {
    const cost = Math.round(50 * (item.upgradeLevel + 1) * (item.level * 0.5));
    if (gold < cost) return;

    setGold((prev) => prev - cost);
    const updated: Item = {
      ...item,
      upgradeLevel: item.upgradeLevel + 1,
    };

    setEquipment((prev) => {
      const slot = item.type as keyof HeroEquipment;
      if (prev[slot]?.id === item.id) {
        return { ...prev, [slot]: updated };
      }
      return prev;
    });

    setInventory((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  };

  // Sell item
  const handleSellItem = (item: Item) => {
    setGold((prev) => prev + item.value);
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
  };

  // Select Map / Arena - Resets in-run chest stats when changing map!
  const handleSelectMap = (map: MapConfig, stage: number = 0) => {
    if (map.id !== currentMap.id) {
      // Reset chest equipment when traveling to a new map
      const resetGear = resetInRunEquipment();
      setEquipment(resetGear);
    }
    setCurrentMap(map);
    setStageIndex(stage);
    setShowMapSelect(false);
    if (gameState === 'playing') {
      initEngine(map, stage);
    }
  };

  // Select Special Event
  const handleSelectEvent = (event: SpecialEvent) => {
    const targetMap =
      ADVENTURE_MAPS.find((m) => m.id === event.mapId) || ADVENTURE_MAPS[0];
    if (targetMap.id !== currentMap.id) {
      const resetGear = resetInRunEquipment();
      setEquipment(resetGear);
    }
    setCurrentMap(targetMap);
    setStageIndex(0);
    setShowMapSelect(false);
    if (gameState === 'title' || gameState === 'lobby') {
      startGame();
    } else {
      initEngine(targetMap, 0);
    }
  };

  // Select Outfit
  const handleSelectOutfit = (outfitId: string) => {
    setActiveOutfitId(outfitId);
  };

  // Select Hero Class
  const handleSelectHeroClass = (heroClass: HeroClass) => {
    setSelectedHeroClass(heroClass);
    setShowCharacterSelect(false);
    if (gameState === 'playing') {
      initEngine(currentMap, stageIndex, heroClass);
    }
  };

  // Lobby Handlers: Buying permanent shop items
  const handleBuyLobbyItem = (item: LobbyItem) => {
    if (gold < item.cost) return;
    setGold((prev) => prev - item.cost);
    setUnlockedLobbyItems((prev) => [...prev, item.id]);
    updateQuestProgress('shop_unlocks', 1);
    sounds.playUpgrade();
  };

  const handleEquipLobbyItem = (item: LobbyItem) => {
    setLobbyEquipment((prev) => ({
      ...prev,
      [item.type]: item,
    }));
    sounds.playEquip();
  };

  const handleUnequipLobbyItem = (type: 'weapon' | 'armor') => {
    setLobbyEquipment((prev) => ({
      ...prev,
      [type]: null,
    }));
  };

  // Lobby Handlers: Claiming Quest Rewards
  const handleClaimQuestReward = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    setGold((prev) => prev + quest.rewardGold);
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );
    sounds.playLevelUp();
  };

  // Lobby Handlers: Spinning Lucky Wheel
  const handleSpinWheel = (reward: WheelReward) => {
    const cost = calculateWheelCost(wheelSpins);
    if (gold < cost) return;

    setGold((prev) => prev - cost);
    setWheelSpins((prev) => prev + 1);

    if (reward.type === 'gold' || reward.type === 'jackpot') {
      setGold((prev) => prev + reward.value);
    } else if (reward.type === 'stat_atk' || reward.type === 'stat_hp') {
      setGold((prev) => prev + reward.value);
    } else if (reward.type === 'rare_box' || reward.type === 'epic_box') {
      const boxItem = generateLootItem(
        Math.random() > 0.5 ? 'weapon' : 'armor',
        reward.type === 'epic_box' ? 'epic' : 'rare',
        heroLevel
      );
      setInventory((prev) => [boxItem, ...prev]);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e]">
      {/* 2.5D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        onMouseMove={(e) => engineRef.current?.handleMouseMove(e.clientX, e.clientY)}
        onMouseDown={() => engineRef.current?.handleMouseDown()}
        onMouseUp={() => engineRef.current?.handleMouseUp()}
        className={`w-full h-full block ${gameState === 'playing' ? 'block' : 'hidden'}`}
      />

      {/* Title Screen View */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={() => setGameState('lobby')}
          onOpenLobby={() => setGameState('lobby')}
          onOpenCharacterSelect={() => setShowCharacterSelect(true)}
          onOpenMapSelect={() => setShowMapSelect(true)}
          onOpenOutfits={() => setShowOutfits(true)}
          activeHeroClass={selectedHeroClass}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* Main Lobby View (Sảnh Chờ, Cửa Hàng, Nhiệm Vụ, Vòng Quay) */}
      {gameState === 'lobby' && (
        <LobbyView
          heroLevel={heroLevel}
          heroExp={heroExp}
          expNext={expNext}
          gold={gold}
          heroStats={heroStats}
          selectedHeroClass={selectedHeroClass}
          activeOutfit={activeOutfit}
          lobbyEquipment={lobbyEquipment}
          unlockedLobbyItems={unlockedLobbyItems}
          quests={quests}
          wheelSpins={wheelSpins}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onBuyLobbyItem={handleBuyLobbyItem}
          onEquipLobbyItem={handleEquipLobbyItem}
          onUnequipLobbyItem={handleUnequipLobbyItem}
          onClaimQuestReward={handleClaimQuestReward}
          onSpinWheel={handleSpinWheel}
          onOpenCharacterSelect={() => setShowCharacterSelect(true)}
          onOpenOutfits={() => setShowOutfits(true)}
          onOpenMapSelect={() => setShowMapSelect(true)}
          onStartGame={startGame}
          onReturnTitle={() => setGameState('title')}
        />
      )}

      {/* Combat HUD */}
      {gameState === 'playing' && (
        <CombatHUD
          stats={heroStats}
          combo={combo}
          boss={boss}
          mapConfig={currentMap}
          stageIndex={stageIndex}
          heroLevel={heroLevel}
          heroExp={heroExp}
          expNext={expNext}
          gold={gold}
          activeOutfit={activeOutfit}
          heroClass={selectedHeroClass}
          monstersRemaining={monstersRemaining}
          cooldowns={cooldowns}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onOpenInventory={() => setShowInventory(true)}
          onOpenOutfits={() => setShowOutfits(true)}
          onOpenCharacterSelect={() => setShowCharacterSelect(true)}
          onOpenMapSelect={() => setShowMapSelect(true)}
          onOpenLobby={() => {
            engineRef.current?.stop();
            setGameState('lobby');
          }}
          onPause={togglePause}
          onTriggerSkill={(key) => {
            if (!engineRef.current) return;
            if (key === 'attack') engineRef.current.triggerAttack();
            if (key === 'dash') engineRef.current.triggerDash();
            if (key === 'whirlwind') engineRef.current.triggerWhirlwind();
            if (key === 'inferno') engineRef.current.triggerInferno();
            if (key === 'ultimate') engineRef.current.triggerUltimate();
          }}
        />
      )}

      {/* Mobile Touch Virtual Controls (Overlay on Mobile & Touch devices) */}
      {gameState === 'playing' && (
        <TouchControls
          heroClass={selectedHeroClass}
          fury={heroStats.fury}
          cooldowns={cooldowns}
          onJoystickMove={(dx: number, dy: number) => engineRef.current?.setVirtualJoystick(dx, dy)}
          onTriggerSkill={(key) => {
            if (!engineRef.current) return;
            if (key === 'attack') engineRef.current.triggerAttack();
            if (key === 'dash') engineRef.current.triggerDash();
            if (key === 'whirlwind') engineRef.current.triggerWhirlwind();
            if (key === 'inferno') engineRef.current.triggerInferno();
            if (key === 'ultimate') engineRef.current.triggerUltimate();
          }}
        />
      )}

      {/* Character Selection Modal */}
      {showCharacterSelect && (
        <CharacterSelectModal
          currentClassId={selectedHeroClass.id}
          onSelectClass={handleSelectHeroClass}
          onClose={() => setShowCharacterSelect(false)}
        />
      )}

      {/* Chest Loot Reward Modal */}
      {activeChest && (
        <ChestRewardModal
          chest={activeChest}
          onEquipItem={handleEquipItem}
          onClaimAll={() => {
            setInventory((prev) => [...prev, ...activeChest.items]);
            setGold((prev) => prev + activeChest.gold);
            setActiveChest(null);
            updateQuestProgress('chests_opened', 1);
          }}
          onNextStage={handleNextStage}
        />
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <InventoryModal
          equipment={equipment}
          inventory={inventory}
          stats={heroStats}
          gold={gold}
          onEquip={handleEquipItem}
          onUnequip={handleUnequipItem}
          onUpgrade={handleUpgradeItem}
          onSell={handleSellItem}
          onClose={() => setShowInventory(false)}
        />
      )}

      {/* Outfits Wardrobe Modal */}
      {showOutfits && (
        <OutfitsModal
          outfits={outfits}
          activeOutfitId={activeOutfitId}
          onSelectOutfit={handleSelectOutfit}
          onClose={() => setShowOutfits(false)}
        />
      )}

      {/* Map & Arena Select Modal */}
      {showMapSelect && (
        <MapSelectModal
          currentMapId={currentMap.id}
          onSelectMap={handleSelectMap}
          onSelectEvent={handleSelectEvent}
          onClose={() => setShowMapSelect(false)}
        />
      )}

      {/* Paused Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => togglePause()}
          onRestart={() => {
            setGameState('playing');
            initEngine(currentMap, stageIndex);
          }}
          onReturnTitle={() => {
            engineRef.current?.stop();
            setGameState('lobby');
          }}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stageNumber={gameOverStats.stageNumber}
          maxCombo={gameOverStats.maxCombo}
          totalKills={gameOverStats.totalKills}
          onRestart={() => {
            setGameState('playing');
            initEngine(currentMap, 0);
          }}
          onReturnTitle={() => {
            engineRef.current?.stop();
            setGameState('lobby');
          }}
        />
      )}
    </div>
  );
}
