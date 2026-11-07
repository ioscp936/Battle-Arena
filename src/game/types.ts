export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type ItemType = 'weapon' | 'armor' | 'helmet' | 'ring' | 'relic';

export interface ItemStats {
  atk?: number;
  def?: number;
  hp?: number;
  critRate?: number; // e.g. 0.05 for 5%
  lifesteal?: number; // e.g. 0.03 for 3%
  speed?: number; // e.g. 15 for movement speed
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  level: number;
  stats: ItemStats;
  icon: string;
  description: string;
  value: number; // gold price
  upgradeLevel: number;
}

export type HeroClassId = 'warrior' | 'mage' | 'assassin' | 'ranger' | 'paladin';

export interface HeroClassSkill {
  name: string;
  key: string;
  cooldown: number;
  description: string;
  icon: string;
}

export interface HeroClass {
  id: HeroClassId;
  name: string;
  title: string;
  role: string;
  difficulty: 'Dễ' | 'Trung Bình' | 'Khó' | 'Chuyên Gia';
  weaponName: string;
  description: string;
  attackType: 'melee' | 'ranged_magic' | 'fast_melee' | 'ranged_physical' | 'tank_melee';
  attackRange: number;
  baseStatsBonus: {
    hp: number;
    atk: number;
    def: number;
    critRate: number;
    speed: number;
  };
  skills: {
    basic: HeroClassSkill;
    skill1: HeroClassSkill;
    skill2: HeroClassSkill;
    skill3: HeroClassSkill;
    ultimate: HeroClassSkill;
  };
  visuals: {
    primaryColor: string;
    secondaryColor: string;
    auraColor: string;
    weaponGlow: string;
    slashColor: string;
    modelType: 'warrior' | 'mage' | 'assassin' | 'ranger' | 'paladin';
    capeColor: string;
    hairColor: string;
  };
}

export interface Outfit {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockRequirement: string;
  statBonus: {
    atkPct: number;
    defPct: number;
    critPct: number;
    speedPct: number;
    lifestealPct?: number;
  };
  visuals: {
    bodyColor: string;
    armorColor: string;
    cloakColor: string;
    weaponColor: string;
    trailColor: string;
    auraColor: string;
    particleHue: string;
  };
}

export type MonsterArchetype = 'swarm' | 'ranged' | 'brute' | 'assassin' | 'miniboss' | 'boss';

export type BossForm =
  | 'dragon'
  | 'treant'
  | 'hydra'
  | 'wolf'
  | 'scorpion'
  | 'skeleton'
  | 'mummy'
  | 'anubis'
  | 'spider'
  | 'golem'
  | 'demon'
  | 'overlord'
  | 'shark'
  | 'siren'
  | 'kraken'
  | 'leviathan';

export interface Monster {
  id: string;
  name: string;
  archetype: MonsterArchetype;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  facing: number; // angle in radians or -1/1
  state: 'idle' | 'chase' | 'windup' | 'attack' | 'hurt' | 'dead';
  stateTimer: number;
  attackCooldown: number;
  attackRange: number;
  attackTelegraphMax: number;
  attackTelegraphTimer: number;
  isBoss: boolean;
  bossPhase?: number;
  bossSkillsTimer?: number;
  bossForm?: BossForm;
  color: string;
  accentColor: string;
  xpValue: number;
  goldValue: number;
  dropBonus: number;
  animationTick?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isCrit?: boolean;
  isEnemy: boolean;
  color: string;
  life: number;
  maxLife: number;
  pierce?: number;
  type?: 'arrow' | 'fireball' | 'frost' | 'shuriken' | 'hammer';
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  isCrit: boolean;
  isPlayer: boolean;
  life: number;
  maxLife: number;
  color: string;
  strokeColor?: string;
  glowColor?: string;
  fontSize?: number;
  badge?: string;
  scaleStart?: number;
  type?: 'normal' | 'crit' | 'heal' | 'hero_hurt';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'fire' | 'snow' | 'feather' | 'rune';
}

export interface ChestEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  opened: boolean;
  tier: Rarity;
  items: Item[];
  gold: number;
  glowAngle: number;
}

export type ComboRank = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface ComboState {
  hits: number;
  maxHits: number;
  rank: ComboRank;
  multiplier: number;
  timer: number;
  maxTimer: number;
  totalDamage: number;
}

export interface StageConfig {
  stageNumber: number; // 1 to 20
  title: string;
  description: string;
  monsterSpawnCount: number;
  archetypes: MonsterArchetype[];
  hasMiniBoss?: boolean;
  isBossStage?: boolean;
  bossName?: string;
  bossForm?: BossForm;
}

export interface MapConfig {
  id: string;
  name: string;
  vietnameseName: string;
  subtitle: string;
  description: string;
  theme: 'forest' | 'desert' | 'cave' | 'underwater' | 'lava' | 'frost' | 'void' | 'colosseum';
  stages: StageConfig[];
  unlocked: boolean;
  reqLevel: number;
  colors: {
    floor: string;
    floorGrid: string;
    wall: string;
    accent: string;
    fog: string;
  };
  weather: 'leaves' | 'embers' | 'snow' | 'sand' | 'void_orbs' | 'blood' | 'bubbles' | 'cave_drip';
}

export interface SpecialEvent {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: string;
  bonus: string;
  mapId: string;
  durationText: string;
  dropRateMultiplier: number;
  enemyDmgMultiplier: number;
}

export interface HeroEquipment {
  weapon: Item | null;
  armor: Item | null;
  helmet: Item | null;
  ring: Item | null;
  relic: Item | null;
}

export interface HeroStats {
  maxHp: number;
  hp: number;
  maxFury: number;
  fury: number;
  atk: number;
  def: number;
  critRate: number;
  critDamage: number;
  lifesteal: number;
  speed: number;
}

export type ShopTier = 'common' | 'rare' | 'epic' | 'legendary';

export interface LobbyItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor';
  tier: ShopTier;
  cost: number;
  stats: {
    hp: number;
    atk: number;
    def: number;
    critRate?: number;
  };
  description: string;
  icon: string;
  visualGlow: string;
}

export interface LobbyEquipment {
  weapon: LobbyItem | null;
  armor: LobbyItem | null;
}

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  rewardGold: number;
  metric: 'kills' | 'boss_kills' | 'chests_opened' | 'combo_rank' | 'dashes' | 'ultimates' | 'shop_unlocks' | 'wave_cleared';
  icon: string;
}

export interface WheelReward {
  id: string;
  label: string;
  type: 'gold' | 'stat_atk' | 'stat_hp' | 'rare_box' | 'epic_box' | 'jackpot';
  value: number;
  color: string;
  weight: number;
}
