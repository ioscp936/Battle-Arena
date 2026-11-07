import {
  BossForm,
  ComboRank,
  HeroClass,
  HeroEquipment,
  HeroStats,
  Item,
  ItemType,
  LobbyEquipment,
  LobbyItem,
  MapConfig,
  MonsterArchetype,
  Outfit,
  QuestItem,
  Rarity,
  SpecialEvent,
  StageConfig,
  WheelReward,
} from './types';

// Damage calculation considering defense, critical hit, and combo multiplier
export function calculateDamage(
  attackerAtk: number,
  defenderDef: number,
  isCrit: boolean,
  critMultiplier: number = 1.75,
  comboMultiplier: number = 1.0
): { damage: number; isCrit: boolean } {
  const mitigation = 100 / (100 + Math.max(0, defenderDef));
  let baseDmg = attackerAtk * mitigation;
  const variance = 0.92 + Math.random() * 0.16;
  baseDmg *= variance;

  if (isCrit) {
    baseDmg *= Math.max(1.5, critMultiplier);
  }

  baseDmg *= Math.max(1.0, comboMultiplier);
  const damage = Math.max(1, Math.round(baseDmg));
  return { damage, isCrit };
}

export interface DamageVisualInfo {
  text: string;
  isCrit: boolean;
  fontSize: number;
  textColor: string;
  strokeColor: string;
  glowColor: string;
  badge?: string;
  scaleStart: number;
  duration: number;
  vx: number;
  vy: number;
}

// Visual attributes and animation trajectory for floating damage feedback
export function getDamageVisualInfo(
  damage: number,
  isCrit: boolean,
  comboRank: ComboRank = 'D',
  isPlayer = false,
  isHeal = false
): DamageVisualInfo {
  if (isHeal) {
    return {
      text: `+${Math.round(damage)}`,
      isCrit: false,
      fontSize: 19,
      textColor: '#4ade80',
      strokeColor: '#052e16',
      glowColor: '#22c55e',
      scaleStart: 1.35,
      duration: 0.75,
      vx: (Math.random() - 0.5) * 20,
      vy: -75 - Math.random() * 25,
    };
  }

  if (isPlayer) {
    return {
      text: `-${Math.round(damage)}`,
      isCrit: false,
      fontSize: 21,
      textColor: '#f87171',
      strokeColor: '#450a0a',
      glowColor: '#ef4444',
      scaleStart: 1.4,
      duration: 0.8,
      vx: (Math.random() - 0.5) * 40,
      vy: -80 - Math.random() * 30,
    };
  }

  if (isCrit) {
    const isSuperCrit = ['S', 'SS', 'SSS'].includes(comboRank) || damage >= 250;
    return {
      text: `${Math.round(damage)}`,
      isCrit: true,
      fontSize: isSuperCrit ? 34 : 29,
      textColor: isSuperCrit ? '#fbbf24' : '#facc15',
      strokeColor: '#09090b',
      glowColor: isSuperCrit ? '#f97316' : '#eab308',
      badge: isSuperCrit ? '★ BẠO KÍCH SIÊU CẤP ★' : '★ BẠO KÍCH ★',
      scaleStart: isSuperCrit ? 2.1 : 1.75,
      duration: 0.95,
      vx: (Math.random() - 0.5) * 70,
      vy: -110 - Math.random() * 40,
    };
  }

  return {
    text: `${Math.round(damage)}`,
    isCrit: false,
    fontSize: 19,
    textColor: '#ffffff',
    strokeColor: '#0f172a',
    glowColor: '#64748b',
    scaleStart: 1.25,
    duration: 0.65,
    vx: (Math.random() - 0.5) * 40,
    vy: -75 - Math.random() * 25,
  };
}

// Combo rank calculation based on consecutive hits
export function getComboRank(hits: number): ComboRank {
  if (hits >= 75) return 'SSS';
  if (hits >= 50) return 'SS';
  if (hits >= 35) return 'S';
  if (hits >= 20) return 'A';
  if (hits >= 10) return 'B';
  if (hits >= 5) return 'C';
  return 'D';
}

// Combo multiplier based on rank
export function getComboMultiplier(rank: ComboRank): number {
  switch (rank) {
    case 'SSS': return 1.60;
    case 'SS': return 1.45;
    case 'S': return 1.30;
    case 'A': return 1.20;
    case 'B': return 1.12;
    case 'C': return 1.06;
    case 'D': return 1.00;
  }
}

// EXP curve
export function calculateExpNext(level: number): number {
  return Math.round(level * 140 + Math.pow(level, 1.3) * 60);
}

// Level up check
export function checkLevelUp(
  currentExp: number,
  currentLevel: number
): { newLevel: number; remainingExp: number; leveledUp: boolean } {
  let exp = currentExp;
  let level = currentLevel;
  let leveledUp = false;

  while (true) {
    const required = calculateExpNext(level);
    if (exp >= required) {
      exp -= required;
      level += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  return { newLevel: level, remainingExp: exp, leveledUp };
}

// 5 Selectable Hero Classes with distinct powers and playstyles
export const HERO_CLASSES: HeroClass[] = [
  {
    id: 'warrior',
    name: 'Chiến Binh Cuồng Đao',
    title: 'Đao Thần Càn Quét Chiến Trường',
    role: 'Đấu Sĩ Cận Chiến (Bộc Phá Sát Thương)',
    difficulty: 'Dễ',
    weaponName: 'Đại Đao Rực Lửa',
    description: 'Chuyên gia cận chiến mang theo đại đao khổng lồ. Sát thương càn quét cực lớn, nộ khí trào dâng và khả năng quét sạch quái vật xung quanh.',
    attackType: 'melee',
    attackRange: 85,
    baseStatsBonus: { hp: 0, atk: 0, def: 4, critRate: 0.05, speed: 0 },
    skills: {
      basic: { name: 'Trảm Kích', key: 'J', cooldown: 0, description: 'Chém 3 nhát liên hoàn diện rộng', icon: 'Swords' },
      skill1: { name: 'Lướt Phá Giáp', key: 'Space', cooldown: 1.2, description: 'Lướt tới chém phá giáp quái', icon: 'Shield' },
      skill2: { name: 'Cuồng Phong Kiếm Vũ', key: 'L', cooldown: 4.5, description: 'Xoay kiếm hút quái và sát thương liên tục', icon: 'Wind' },
      skill3: { name: 'Thiên Hỏa Liệt Trảm', key: 'I', cooldown: 6.0, description: 'Đập nổ cột dung nham chấn động', icon: 'Flame' },
      ultimate: { name: 'Ma Kiếm Thần Nộ', key: 'U', cooldown: 14.0, description: 'Bùng nổ sức mạnh cổ đại hủy diệt', icon: 'Zap' },
    },
    visuals: {
      primaryColor: '#b91c1c',
      secondaryColor: '#ea580c',
      auraColor: 'rgba(239, 68, 68, 0.4)',
      weaponGlow: '#f97316',
      slashColor: '#ef4444',
      modelType: 'warrior',
      capeColor: '#991b1b',
      hairColor: '#f59e0b',
    },
  },
  {
    id: 'mage',
    name: 'Nữ Pháp Sư Băng Hỏa',
    title: 'Đại Pháp Sư Nguyên Tố',
    role: 'Phép Thuật Tầm Xa (Khống Chế & Hủy Diệt)',
    difficulty: 'Trung Bình',
    weaponName: 'Trượng Ma Pháp Vĩnh Cửu',
    description: 'Tấn công tầm xa bằng hỏa cầu ma thuật nổ tung. Có khả năng dịch chuyển tức thời và đông cứng kẻ thù bằng bão tuyết tuyệt địa.',
    attackType: 'ranged_magic',
    attackRange: 380,
    baseStatsBonus: { hp: -15, atk: 3, def: -2, critRate: 0.08, speed: 10 },
    skills: {
      basic: { name: 'Hỏa Cầu Ma Pháp', key: 'J', cooldown: 0, description: 'Bắn hỏa cầu tầm xa phát nổ diện rộng', icon: 'Flame' },
      skill1: { name: 'Dịch Chuyển Tức Thời', key: 'Space', cooldown: 1.5, description: 'Blink xuyên không gian tránh đòn', icon: 'Sparkles' },
      skill2: { name: 'Bão Tuyết Tuyệt Địa', key: 'L', cooldown: 4.0, description: 'Tạo vùng bão tuyết đông cứng quái vật', icon: 'Snowflake' },
      skill3: { name: 'Sét Giật Thiên Phạt', key: 'I', cooldown: 5.5, description: 'Phóng tia sét giật liên hoàn', icon: 'Zap' },
      ultimate: { name: 'Thiên Thạch Diệt Thế', key: 'U', cooldown: 15.0, description: 'Triệu hồi thiên thạch rơi nghiền nát map', icon: 'Sun' },
    },
    visuals: {
      primaryColor: '#4338ca',
      secondaryColor: '#38bdf8',
      auraColor: 'rgba(56, 189, 248, 0.45)',
      weaponGlow: '#818cf8',
      slashColor: '#38bdf8',
      modelType: 'mage',
      capeColor: '#312e81',
      hairColor: '#c084fc',
    },
  },
  {
    id: 'assassin',
    name: 'Thích Khách Bóng Đêm',
    title: 'Lưỡi Dao Vô Ảnh Tận Diệt',
    role: 'Sát Thủ Cơ Động (Bạo Kích Cực Cao)',
    difficulty: 'Khó',
    weaponName: 'Song Đoản Kiếm U Hồn',
    description: 'Cầm song đoản kiếm tốc độ tấn công như vũ bão. Tỉ lệ bạo kích cao nhất game, phóng phi tiêu độc và lướt sau lưng kẻ thù.',
    attackType: 'fast_melee',
    attackRange: 65,
    baseStatsBonus: { hp: -10, atk: 2, def: -3, critRate: 0.16, speed: 30 },
    skills: {
      basic: { name: 'Song Đao Thần Tốc', key: 'J', cooldown: 0, description: 'Chém kép cực nhanh với sát thương chí mạng', icon: 'Zap' },
      skill1: { name: 'Ảnh Bộ Tốc Biến', key: 'Space', cooldown: 0.9, description: 'Lướt bóng ma cực nhanh xuyên qua quái', icon: 'Wind' },
      skill2: { name: 'Phi Tiêu Độc Phong', key: 'L', cooldown: 3.5, description: 'Bắn 8 phi tiêu độc tỏa 360 độ', icon: 'Crosshair' },
      skill3: { name: 'Phân Thân Ám Sát', key: 'I', cooldown: 5.0, description: 'Bật ảo ảnh bóng ma chém xoáy', icon: 'Skull' },
      ultimate: { name: 'Vạn Kiếm Hư Không', key: 'U', cooldown: 12.0, description: 'Chém liên hoàn 12 lần tốc độ âm thanh', icon: 'Swords' },
    },
    visuals: {
      primaryColor: '#09090b',
      secondaryColor: '#10b981',
      auraColor: 'rgba(16, 185, 129, 0.4)',
      weaponGlow: '#34d399',
      slashColor: '#10b981',
      modelType: 'assassin',
      capeColor: '#064e3b',
      hairColor: '#e4e4e7',
    },
  },
  {
    id: 'ranger',
    name: 'Thần Tiễn Thủ Tinh Linh',
    title: 'Xạ Thủ Thần Gió Rừng Xanh',
    role: 'Xạ Thủ Tầm Xa (Thả Diều & Bắn Tỉa)',
    difficulty: 'Trung Bình',
    weaponName: 'Cung Thần Gió Bão',
    description: 'Bắn tên thần tốc từ cự ly an toàn, khả năng bắn xuyên thấu quái vật và thả diều không cho quái vật áp sát.',
    attackType: 'ranged_physical',
    attackRange: 420,
    baseStatsBonus: { hp: -10, atk: 2, def: -1, critRate: 0.10, speed: 20 },
    skills: {
      basic: { name: 'Tiễn Xuyên Thấu', key: 'J', cooldown: 0, description: 'Bắn mũi tên thần tốc tầm xa', icon: 'Crosshair' },
      skill1: { name: 'Nhào Lộn Bắn Lùi', key: 'Space', cooldown: 1.1, description: 'Nhào lộn né tránh và bắn 3 mũi tên', icon: 'Wind' },
      skill2: { name: 'Mưa Tên Bão Tố', key: 'L', cooldown: 4.2, description: 'Mưa tên trút xuống khu vực chỉ định', icon: 'CloudRain' },
      skill3: { name: 'Phá Giáp Đại Tiễn', key: 'I', cooldown: 5.8, description: 'Bắn mũi tên khổng lồ xuyên thẳng mọi quái vật', icon: 'Zap' },
      ultimate: { name: 'Thiên Tinh Bão Tiễn', key: 'U', cooldown: 13.5, description: 'Bắn chùm tên ánh sao hủy diệt kẻ địch', icon: 'Sparkles' },
    },
    visuals: {
      primaryColor: '#14532d',
      secondaryColor: '#84cc16',
      auraColor: 'rgba(132, 204, 22, 0.4)',
      weaponGlow: '#bef264',
      slashColor: '#84cc16',
      modelType: 'ranger',
      capeColor: '#166534',
      hairColor: '#fef08a',
    },
  },
  {
    id: 'paladin',
    name: 'Thánh Kỵ Sĩ Ánh Sáng',
    title: 'Hộ Vệ Bất Tử Thiên Đàng',
    role: 'Đỡ Đòn & Hồi Phục (Bất Khả Xâm Phạm)',
    difficulty: 'Dễ',
    weaponName: 'Búa Thánh & Khiên Phản Đòn',
    description: 'Lớp nhân vật siêu trâu bò với lượng máu và giáp khổng lồ. Có khả năng tự hồi phục sinh lực và khiên thánh phản sát thương quái vật.',
    attackType: 'tank_melee',
    attackRange: 90,
    baseStatsBonus: { hp: 25, atk: -1, def: 8, critRate: 0.03, speed: -10 },
    skills: {
      basic: { name: 'Búa Thánh Trừng Phạt', key: 'J', cooldown: 0, description: 'Đập búa uy lực gây choáng nhẹ', icon: 'Shield' },
      skill1: { name: 'Xung Kích Khiên Thần', key: 'Space', cooldown: 1.3, description: 'Đẩy lùi và hất văng quái vật trên đường', icon: 'ShieldAlert' },
      skill2: { name: 'Vòng Tròn Thánh Quang', key: 'L', cooldown: 4.8, description: 'Hồi 15% HP và đốt cháy quái xung quanh', icon: 'Heart' },
      skill3: { name: 'Búa Thần Sấm Sét', key: 'I', cooldown: 6.2, description: 'Ném búa bay xoay vòng và quay lại', icon: 'Zap' },
      ultimate: { name: 'Phán Quyết Thiên Sứ', key: 'U', cooldown: 16.0, description: 'Bung cánh thiên sứ giáng thánh kiếm hủy diệt', icon: 'Sun' },
    },
    visuals: {
      primaryColor: '#713f12',
      secondaryColor: '#eab308',
      auraColor: 'rgba(234, 179, 8, 0.45)',
      weaponGlow: '#fef08a',
      slashColor: '#facc15',
      modelType: 'paladin',
      capeColor: '#854d0e',
      hairColor: '#fef9c3',
    },
  },
];

// Item names dictionary for procedural loot generation
const WEAPON_NAMES: Record<Rarity, string[]> = {
  common: ['Kiếm Sắt Rèn Thô', 'Đoản Kiếm Thợ Rèn', 'Đại Đao Gỗ Sồi'],
  rare: ['Lưỡi Kiếm Phong Ba', 'Huyết Kiếm Nanh Sói', 'Băng Kiếm Linh Hồn'],
  epic: ['Hắc Diệt Trảm Đao', 'Cuồng Nộ Long Kiếm', 'Thánh Kiếm Phán Quyết'],
  legendary: ['Thần Ma Đoạt Mệnh Kiếm', 'Vạn Kiếm Quy Tông', 'Hỏa Long Liệt Địa Kiếm'],
  mythic: ['Cửu U Hỗn Độn Kiếm', 'Thần Khí Sáng Thế', 'Vô Cực Thần Kiếm'],
};

const ARMOR_NAMES: Record<Rarity, string[]> = {
  common: ['Áo Giáp Da Nai', 'Giáp Vải Gia Cố', 'Áo Giáp Sắt Nung'],
  rare: ['Giáp Thép Hắc Vân', 'Chiến Bào Băng Sương', 'Khôi Giáp Nanh Gấu'],
  epic: ['Huyết Long Trọng Giáp', 'Thánh Giáp Hộ Mệnh', 'Minh Vương Hắc Bào'],
  legendary: ['Bất Diệt Long Lân Giáp', 'Vĩnh Hằng Thiên Giáp', 'Thái Cổ Thần Giáp'],
  mythic: ['Hỗn Độn Bất Tử Bào', 'Thần Ma Nghịch Thiên Giáp', 'Khởi Nguyên Chiến Giáp'],
};

const HELMET_NAMES: Record<Rarity, string[]> = {
  common: ['Mũ Sắt Chiến Binh', 'Mũ Da Thợ Săn', 'Mũ Trùm Vải Đen'],
  rare: ['Mũ Giáp Mắt Cú', 'Mũ Sắt Nanh Sói', 'Vương Miện Băng Lam'],
  epic: ['Đầu Lâu Hắc Ma Mão', 'Mũ Hoàng Kim Dũng Sĩ', 'Mũ Rồng Lửa Bốc Cháy'],
  legendary: ['Vương Miện Chiến Thần', 'Thần Mão Bất Diệt', 'Minh Thần Hộ Diện'],
  mythic: ['Thiên Đạo Thần Quán', 'Hỗn Độn Ma Nhãn Mão', 'Tối Cao Thánh Diện'],
};

const RING_NAMES: Record<Rarity, string[]> = {
  common: ['Nhẫn Đồng Thô', 'Nhẫn Bạc Đơn Sơ', 'Nhẫn Đá Núi Lửa'],
  rare: ['Nhẫn Huyết Thạch', 'Nhẫn Bão Tố Linh Hồn', 'Nhẫn Băng Tinh Ngọc'],
  epic: ['Nhẫn Cuồng Ma Hút Huyết', 'Nhẫn Ma Pháp Tối Thượng', 'Nhẫn Long Hồn Bạo Kích'],
  legendary: ['Nhẫn Thần Ma Vĩnh Kiếp', 'Thái Dương Hoàng Kim Giới', 'U Minh Đoạt Phách Giới'],
  mythic: ['Sáng Thế Thần Giới', 'Hư Không Vạn Giới Luân', 'Vô Cực Chí Tôn Giới'],
};

const RELIC_NAMES: Record<Rarity, string[]> = {
  common: ['Phù Hộ Thần Mộc', 'Đá Phép Phát Sáng', 'Móng Vuốt Quái Thú'],
  rare: ['Chuỗi Hạt Trảm Hồn', 'Ấn Ký Sói Đầu Đàn', 'Trái Tim Băng Giá'],
  epic: ['Long Châu Rực Cháy', 'Ấn Tín Thánh Kỵ Sĩ', 'Mắt Quỷ U Hồn'],
  legendary: ['Trái Tim Dung Nham Bất Diệt', 'Chén Thánh Thần Linh', 'Mảnh Vỡ Hư Không'],
  mythic: ['Ngọc Tỷ Hỗn Nguyên', 'Lõi Tinh Vân Vô Tận', 'Thần Vật Sáng Thế'],
};

// Generate procedural item from chest
export function generateLootItem(
  type: ItemType,
  rarity: Rarity,
  itemLevel: number
): Item {
  const namesPool =
    type === 'weapon'
      ? WEAPON_NAMES
      : type === 'armor'
      ? ARMOR_NAMES
      : type === 'helmet'
      ? HELMET_NAMES
      : type === 'ring'
      ? RING_NAMES
      : RELIC_NAMES;

  const nameList = namesPool[rarity];
  const name = nameList[Math.floor(Math.random() * nameList.length)];

  const rarityMult =
    rarity === 'common'
      ? 1.0
      : rarity === 'rare'
      ? 1.15
      : rarity === 'epic'
      ? 1.35
      : rarity === 'legendary'
      ? 1.6
      : 1.9;

  const stats: Item['stats'] = {};

  if (type === 'weapon') {
    stats.atk = Math.max(1, Math.round((1.5 + itemLevel * 0.7) * rarityMult));
    if (rarity !== 'common') {
      stats.critRate = +(0.01 + (rarityMult - 1) * 0.015).toFixed(2);
    }
    if (rarity === 'legendary' || rarity === 'mythic') {
      stats.lifesteal = +(0.01 + (rarityMult - 1.5) * 0.01).toFixed(2);
    }
  } else if (type === 'armor') {
    stats.def = Math.max(1, Math.round((1.5 + itemLevel * 0.45) * rarityMult));
    stats.hp = Math.max(5, Math.round((8 + itemLevel * 2.8) * rarityMult));
  } else if (type === 'helmet') {
    stats.def = Math.max(1, Math.round((1.0 + itemLevel * 0.35) * rarityMult));
    stats.hp = Math.max(5, Math.round((6 + itemLevel * 2.0) * rarityMult));
    if (rarity !== 'common') {
      stats.atk = Math.max(1, Math.round((0.5 + itemLevel * 0.2) * rarityMult));
    }
  } else if (type === 'ring') {
    stats.atk = Math.max(1, Math.round((1.0 + itemLevel * 0.35) * rarityMult));
    stats.critRate = +(0.01 + (rarityMult - 1) * 0.015).toFixed(2);
    if (rarity === 'legendary' || rarity === 'mythic') {
      stats.speed = Math.round(8 * (rarityMult - 1.3));
    }
  } else {
    stats.hp = Math.max(5, Math.round((8 + itemLevel * 2.0) * rarityMult));
    stats.atk = Math.max(1, Math.round((0.8 + itemLevel * 0.3) * rarityMult));
    stats.def = Math.max(1, Math.round((0.8 + itemLevel * 0.25) * rarityMult));
    if (rarity !== 'common') {
      stats.lifesteal = +(0.01 + (rarityMult - 1) * 0.01).toFixed(2);
    }
  }

  const baseValue = Math.round(20 * itemLevel * rarityMult);

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    type,
    rarity,
    level: itemLevel,
    stats,
    icon: type,
    description: `Trang bị ${rarity.toUpperCase()} cấp ${itemLevel} tinh luyện cân bằng.`,
    value: baseValue,
    upgradeLevel: 0,
  };
}

// Roll chest loot after stage completion
export function rollChestLoot(
  stageNumber: number,
  mapIndex: number,
  isBoss: boolean,
  luckBonus: number = 0
): { tier: Rarity; items: Item[]; gold: number } {
  const itemLevel = Math.max(1, mapIndex * 5 + stageNumber);
  const roll = Math.random() + luckBonus * 0.1;

  let tier: Rarity = 'common';
  if (isBoss) {
    if (roll > 0.85) tier = 'mythic';
    else if (roll > 0.50) tier = 'legendary';
    else if (roll > 0.20) tier = 'epic';
    else tier = 'rare';
  } else {
    if (roll > 0.95) tier = 'legendary';
    else if (roll > 0.75) tier = 'epic';
    else if (roll > 0.40) tier = 'rare';
    else tier = 'common';
  }

  const itemCount = isBoss ? 2 + (Math.random() > 0.5 ? 1 : 0) : 1 + (Math.random() > 0.6 ? 1 : 0);
  const types: ItemType[] = ['weapon', 'armor', 'helmet', 'ring', 'relic'];
  const shuffledTypes = [...types].sort(() => Math.random() - 0.5);

  const items: Item[] = [];
  for (let i = 0; i < itemCount; i++) {
    const itemType = shuffledTypes[i % shuffledTypes.length];
    const itemTier = i === 0 ? tier : (Math.random() > 0.4 ? tier : 'rare');
    items.push(generateLootItem(itemType, itemTier, itemLevel));
  }

  const gold = Math.round((30 + mapIndex * 40 + stageNumber * 10) * (isBoss ? 2.5 : 1.0));
  return { tier, items, gold };
}

// Compute total hero stats combining base, hero class, equipped gear, active outfit, and permanent lobby gear
export function applyHeroStats(
  baseLevel: number,
  equipment: HeroEquipment,
  outfit: Outfit,
  heroClass?: HeroClass,
  lobbyEquipment?: LobbyEquipment
): HeroStats {
  const cls = heroClass || HERO_CLASSES[0];
  // Rebalanced base: 250 HP and 20 ATK for starting level 1 hero
  const baseHp = 250 + (baseLevel - 1) * 35 + cls.baseStatsBonus.hp;
  const baseAtk = 20 + (baseLevel - 1) * 3 + cls.baseStatsBonus.atk;
  const baseDef = 10 + (baseLevel - 1) * 2 + cls.baseStatsBonus.def;
  const baseCrit = 0.08 + cls.baseStatsBonus.critRate;
  const baseCritDmg = 1.75;
  const baseLifesteal = 0.02;
  const baseSpeed = 220 + cls.baseStatsBonus.speed;

  let totalAtk = baseAtk;
  let totalDef = baseDef;
  let totalHp = baseHp;
  let totalCrit = baseCrit;
  let totalLifesteal = baseLifesteal;
  let totalSpeed = baseSpeed;

  // Add permanent Lobby equipment if equipped
  if (lobbyEquipment?.weapon) {
    totalAtk += lobbyEquipment.weapon.stats.atk;
    totalHp += lobbyEquipment.weapon.stats.hp;
    totalDef += lobbyEquipment.weapon.stats.def;
    if (lobbyEquipment.weapon.stats.critRate) totalCrit += lobbyEquipment.weapon.stats.critRate;
  }
  if (lobbyEquipment?.armor) {
    totalHp += lobbyEquipment.armor.stats.hp;
    totalDef += lobbyEquipment.armor.stats.def;
    totalAtk += lobbyEquipment.armor.stats.atk;
  }

  // Add in-run temporary equipment stats
  const items = [
    equipment.weapon,
    equipment.armor,
    equipment.helmet,
    equipment.ring,
    equipment.relic,
  ].filter(Boolean) as Item[];

  for (const item of items) {
    const upgBonus = 1 + item.upgradeLevel * 0.05;
    if (item.stats.atk) totalAtk += item.stats.atk * upgBonus;
    if (item.stats.def) totalDef += item.stats.def * upgBonus;
    if (item.stats.hp) totalHp += item.stats.hp * upgBonus;
    if (item.stats.critRate) totalCrit += item.stats.critRate;
    if (item.stats.lifesteal) totalLifesteal += item.stats.lifesteal;
    if (item.stats.speed) totalSpeed += item.stats.speed;
  }

  // Add outfit percentage bonuses (balanced, non-overpowered)
  totalAtk *= 1 + outfit.statBonus.atkPct;
  totalDef *= 1 + outfit.statBonus.defPct;
  totalCrit += outfit.statBonus.critPct;
  totalSpeed *= 1 + outfit.statBonus.speedPct;
  if (outfit.statBonus.lifestealPct) {
    totalLifesteal += outfit.statBonus.lifestealPct;
  }

  return {
    maxHp: Math.round(totalHp),
    hp: Math.round(totalHp),
    maxFury: 100,
    fury: 0,
    atk: Math.round(totalAtk),
    def: Math.round(totalDef),
    critRate: Math.min(0.80, +totalCrit.toFixed(2)),
    critDamage: baseCritDmg,
    lifesteal: Math.min(0.30, +totalLifesteal.toFixed(2)),
    speed: Math.round(totalSpeed),
  };
}

// 6 Distinct Outfits
export function createDefaultOutfits(): Outfit[] {
  return [
    {
      id: 'outfit_dark_knight',
      name: 'Hắc Ám Hiệp Sĩ',
      title: 'Hiệp Sĩ Bóng Đêm Khởi Nguyên',
      description: 'Bộ giáp hắc thiết viền tím huyền bí, cân bằng toàn diện công thủ.',
      icon: 'Shield',
      unlocked: true,
      unlockRequirement: 'Mặc định khi bắt đầu',
      statBonus: {
        atkPct: 0.0,
        defPct: 0.04,
        critPct: 0.02,
        speedPct: 0.02,
      },
      visuals: {
        bodyColor: '#1e293b',
        armorColor: '#334155',
        cloakColor: '#4f46e5',
        weaponColor: '#818cf8',
        trailColor: '#6366f1',
        auraColor: 'rgba(99, 102, 241, 0.35)',
        particleHue: '#818cf8',
      },
    },
    {
      id: 'outfit_crimson_dragon',
      name: 'Chiến Binh Hỏa Long',
      title: 'Đao Phủ Hỏa Long Liệt Huyết',
      description: 'Khoác lên mình vảy Rồng Đỏ rực cháy, tăng mạnh lực tấn công và sát thương bạo kích.',
      icon: 'Flame',
      unlocked: false,
      unlockRequirement: 'Hạ gục Boss Map 2 (Viêm Ma)',
      statBonus: {
        atkPct: 0.22,
        defPct: -0.05,
        critPct: 0.12,
        speedPct: 0.08,
      },
      visuals: {
        bodyColor: '#450a0a',
        armorColor: '#991b1b',
        cloakColor: '#dc2626',
        weaponColor: '#f97316',
        trailColor: '#ef4444',
        auraColor: 'rgba(239, 68, 68, 0.45)',
        particleHue: '#f97316',
      },
    },
    {
      id: 'outfit_frost_lord',
      name: 'Kiếm Thánh Băng Hàn',
      title: 'Lãnh Chúa Băng Sơn Tuyệt Xứ',
      description: 'Lưỡi kiếm phủ hàn băng thiên cổ, phòng thủ siêu việt và giảm tốc độ kẻ địch xung quanh.',
      icon: 'Snowflake',
      unlocked: false,
      unlockRequirement: 'Vượt qua Map 3 (Đỉnh Núi Băng Giá)',
      statBonus: {
        atkPct: 0.08,
        defPct: 0.25,
        critPct: 0.05,
        speedPct: 0.05,
        lifestealPct: 0.04,
      },
      visuals: {
        bodyColor: '#082f49',
        armorColor: '#0284c7',
        cloakColor: '#38bdf8',
        weaponColor: '#7dd3fc',
        trailColor: '#0ea5e9',
        auraColor: 'rgba(56, 189, 248, 0.4)',
        particleHue: '#bae6fd',
      },
    },
    {
      id: 'outfit_shadow_shinobi',
      name: 'Sát Thủ Vô Cực',
      title: 'Bóng Ma Đoạt Mệnh Vô Tung',
      description: 'Tốc độ di chuyển và bộc phá bạo kích đạt đỉnh cao, thoắt ẩn thoắt hiện trong chiến trường.',
      icon: 'Zap',
      unlocked: false,
      unlockRequirement: 'Đạt chuỗi 50 Combo trong chiến đấu',
      statBonus: {
        atkPct: 0.18,
        defPct: -0.08,
        critPct: 0.22,
        speedPct: 0.20,
      },
      visuals: {
        bodyColor: '#09090b',
        armorColor: '#27272a',
        cloakColor: '#10b981',
        weaponColor: '#34d399',
        trailColor: '#059669',
        auraColor: 'rgba(16, 185, 129, 0.4)',
        particleHue: '#6ee7b7',
      },
    },
    {
      id: 'outfit_paladin_light',
      name: 'Thánh Kỵ Sĩ Quang Minh',
      title: 'Đại Hộ Vệ Thần Điện Ánh Sáng',
      description: 'Thánh quang bao phủ cơ thể, hồi phục sinh lực thần tốc và phòng hộ kiên cố.',
      icon: 'Sun',
      unlocked: false,
      unlockRequirement: 'Mở 10 Rương Báu Huyền Thoại',
      statBonus: {
        atkPct: 0.12,
        defPct: 0.18,
        critPct: 0.06,
        speedPct: 0.04,
        lifestealPct: 0.08,
      },
      visuals: {
        bodyColor: '#422006',
        armorColor: '#ca8a04',
        cloakColor: '#facc15',
        weaponColor: '#fef08a',
        trailColor: '#eab308',
        auraColor: 'rgba(234, 179, 8, 0.45)',
        particleHue: '#fef9c3',
      },
    },
    {
      id: 'outfit_abyssal_overlord',
      name: 'Ma Thần Hư Không',
      title: 'Chúa Tể Vực Thẳm Vô Tận',
      description: 'Trang phục tối thượng nắm giữ sức mạnh Hư Vô, cuồng nộ áp đảo mọi đối thủ.',
      icon: 'Skull',
      unlocked: false,
      unlockRequirement: 'Tiêu diệt Boss Map 5 (Hư Vô Thôn Phệ)',
      statBonus: {
        atkPct: 0.35,
        defPct: 0.15,
        critPct: 0.20,
        speedPct: 0.12,
        lifestealPct: 0.06,
      },
      visuals: {
        bodyColor: '#2e1065',
        armorColor: '#6b21a8',
        cloakColor: '#c084fc',
        weaponColor: '#e879f9',
        trailColor: '#a855f7',
        auraColor: 'rgba(168, 85, 247, 0.55)',
        particleHue: '#d8b4fe',
      },
    },
  ];
}

// Initial default equipment for the hero (balanced for 250 base HP and 20 base ATK)
export function createDefaultEquipment(): HeroEquipment {
  return {
    weapon: {
      id: 'item_starter_sword',
      name: 'Đoản Kiếm Tập Luyện',
      type: 'weapon',
      rarity: 'common',
      level: 1,
      stats: { atk: 0 },
      icon: 'weapon',
      description: 'Vũ khí cơ bản của hiệp sĩ khi bước vào đấu trường.',
      value: 15,
      upgradeLevel: 0,
    },
    armor: {
      id: 'item_starter_armor',
      name: 'Áo Vải Dày',
      type: 'armor',
      rarity: 'common',
      level: 1,
      stats: { def: 0, hp: 0 },
      icon: 'armor',
      description: 'Trang phục khởi đầu giản dị.',
      value: 15,
      upgradeLevel: 0,
    },
    helmet: null,
    ring: null,
    relic: null,
  };
}

// Stage generator: creates 20 progressive waves per map with bosses at wave 5, 10, 15, 20
function generate20Stages(
  themeName: string,
  bosses: Record<number, { name: string; form: BossForm; title: string; description: string }>,
  regularMobNames: string[]
): StageConfig[] {
  const stages: StageConfig[] = [];
  for (let w = 1; w <= 20; w++) {
    if (bosses[w]) {
      const b = bosses[w];
      stages.push({
        stageNumber: w,
        title: `Ải ${w} (BOSS): ${b.title.toUpperCase()}`,
        description: b.description,
        monsterSpawnCount: 5 + Math.floor(w / 5),
        archetypes: ["swarm", "boss"],
        isBossStage: true,
        bossName: b.name,
        bossForm: b.form,
      });
    } else {
      const mobIdx = (w - 1) % regularMobNames.length;
      const waveTier = Math.floor((w - 1) / 5);
      const count = 6 + Math.floor(w * 0.45);
      const archetypes: MonsterArchetype[] =
        waveTier === 0
          ? ["swarm"]
          : waveTier === 1
          ? ["swarm", "ranged"]
          : waveTier === 2
          ? ["ranged", "brute"]
          : ["swarm", "ranged", "brute", "assassin"];

      stages.push({
        stageNumber: w,
        title: `Ải ${w}: ${regularMobNames[mobIdx]}`,
        description: `Đợt quái thứ ${w} của ${themeName}. Tiêu diệt toàn bộ để tiến vào ải tiếp theo.`,
        monsterSpawnCount: count,
        archetypes,
        hasMiniBoss: w % 5 === 4,
      });
    }
  }
  return stages;
}

// 4 Main Adventure Maps (Forest, Desert, Cave, Underwater) with 20 waves each and Bosses every 5 waves
export const ADVENTURE_MAPS: MapConfig[] = [
  {
    id: "map_forest",
    name: "Rừng Nguyên Sinh",
    vietnameseName: "Bản Đồ 1: Rừng Nguyên Sinh",
    subtitle: "Nơi ngự trị của Cổ Long Rừng Rậm và bầy quái thú bí ẩn",
    description: "Khu rừng đại ngàn cổ xưa bị ma thuật hắc ám xâm chiếm. Băng qua 20 ải thử thách để đối đầu Cổ Long thức tỉnh.",
    theme: "forest",
    unlocked: true,
    reqLevel: 1,
    colors: {
      floor: "#0c1a11",
      floorGrid: "#173422",
      wall: "#062013",
      accent: "#22c55e",
      fog: "rgba(12, 26, 17, 0.75)",
    },
    weather: "leaves",
    stages: generate20Stages(
      "Rừng Nguyên Sinh",
      {
        5: {
          name: "Thần Sói Rừng Xanh",
          form: "wolf",
          title: "Thần Sói Rừng Xanh",
          description: "Vua sói nanh bạc hú vang trong sương đêm, triệu hồi bầy sói hoang cắn xé!",
        },
        10: {
          name: "Cổ Mộc Tinh Linh",
          form: "treant",
          title: "Cổ Mộc Tinh Linh",
          description: "Thụ tinh ngàn năm thức tỉnh, giáng rễ cây gai nhọn từ lòng đất!",
        },
        15: {
          name: "Mãng Xà Bách Độc",
          form: "hydra",
          title: "Mãng Xà Bách Độc",
          description: "Mãng xà nhiều đầu phun nọc độc acid ăn mòn và quẫy đuôi quét ngã đối thủ!",
        },
        20: {
          name: "Cổ Long Rừng Rậm",
          form: "dragon",
          title: "Cổ Long Rừng Rậm (Trùm Cuối)",
          description: "Chúa tể loài Rồng thức giấc! Sải cánh khổng lồ phun ngọn lửa ngọc bích hủy diệt thế gian!",
        },
      },
      ["Sói Hoang Trinh Sát", "Dơi Hắc Ám", "Gai Rừng Độc", "Mộc Tinh Tầm Gửi", "Cung Thủ Rừng Già", "Xà Tộc Độc Lục", "Sát Thủ Cành Gai", "Vệ Binh Rồng Xanh"]
    ),
  },
  {
    id: "map_desert",
    name: "Sa Mạc Cổ Đại",
    vietnameseName: "Bản Đồ 2: Sa Mạc Cổ Đại",
    subtitle: "Vương quốc cát vàng nơi Người Xương và Xác Ướp ngự trị",
    description: "Vùng đất cát bỏng chôn vùi hàng triệu vong hồn. Đánh bại Bọ Cạp Hoàng Kim, Tướng Lĩnh Xương, Xác Ướp và Tử Thần Anubis.",
    theme: "desert",
    unlocked: true,
    reqLevel: 3,
    colors: {
      floor: "#21190c",
      floorGrid: "#423218",
      wall: "#342612",
      accent: "#eab308",
      fog: "rgba(33, 25, 12, 0.75)",
    },
    weather: "sand",
    stages: generate20Stages(
      "Sa Mạc Cổ Đại",
      {
        5: {
          name: "Bọ Cạp Hoàng Kim",
          form: "scorpion",
          title: "Bọ Cạp Hoàng Kim",
          description: "Bọ cạp khổng lồ chui lên từ cát vàng với ngòi độc châm chết chóc!",
        },
        10: {
          name: "Tướng Lĩnh Người Xương",
          form: "skeleton",
          title: "Tướng Lĩnh Người Xương",
          description: "Chiến tướng xương khô bất tử cầm song kiếm xương vung lốc kiếm xoáy!",
        },
        15: {
          name: "Quái Vật Xác Ướp Ngàn Năm",
          form: "mummy",
          title: "Quái Vật Xác Ướp Ngàn Năm",
          description: "Pharaoh xác ướp quấn dải băng cổ đại, triệu hồi bão cát và tà linh nguyền rủa!",
        },
        20: {
          name: "Thần Sa Anubis Bạo Quân",
          form: "anubis",
          title: "Thần Sa Anubis Bạo Quân (Trùm Cuối)",
          description: "Tử thần Anubis cầm Sa Trượng Hoàng Kim, giáng đòn sấm sét và bão cát tận diệt!",
        },
      },
      ["Bọ Cát Sa Mạc", "Rắn Chuông Cát", "Gai Cát Độc", "Lính Xương Cát", "Cung Thủ Xương Khô", "Hộ Vệ Lăng Mộ", "Ma Cát Vong Hồn", "Quân Đoàn Anubis"]
    ),
  },
  {
    id: "map_cave",
    name: "Hang Động U Tối",
    vietnameseName: "Bản Đồ 3: Hang Động U Tối",
    subtitle: "Vực thẳm sâu thẳm nơi Quỷ Dữ và Thạch Ma thức giấc",
    description: "Hang đá ẩm ướt với thạch nhũ phát quang ma mị. Vượt qua Nhện Độc, Thạch Ma Nham Thạch và đối đầu Quỷ Vương Vực Sâu.",
    theme: "cave",
    unlocked: true,
    reqLevel: 5,
    colors: {
      floor: "#13111c",
      floorGrid: "#28233a",
      wall: "#1e182e",
      accent: "#a855f7",
      fog: "rgba(19, 17, 28, 0.75)",
    },
    weather: "cave_drip",
    stages: generate20Stages(
      "Hang Động U Tối",
      {
        5: {
          name: "Nhện Quỷ Độc Hang Sâu",
          form: "spider",
          title: "Nhện Quỷ Độc Hang Sâu",
          description: "Chúa nhện hang sâu phun tơ trói chân và tiết độc tố tê liệt!",
        },
        10: {
          name: "Thạch Ma Nham Thạch",
          form: "golem",
          title: "Thạch Ma Nham Thạch",
          description: "Khổng lồ đá obsidian mình bọc gai nhọn dập đất nứt toác!",
        },
        15: {
          name: "Dạ Xoa Huyết Quỷ",
          form: "demon",
          title: "Dạ Xoa Huyết Quỷ",
          description: "Quỷ dữ vực sâu với sừng nhọn và cánh dơi vung lưỡi hái máu đoạt mạng!",
        },
        20: {
          name: "Chúa Tể Quỷ Vương Vực Sâu",
          form: "overlord",
          title: "Chúa Tể Quỷ Vương Vực Sâu (Trùm Cuối)",
          description: "Đại Ma Vương tối cao thống trị vực thẳm ma giới với ma trận ngũ giác và hắc hỏa!",
        },
      },
      ["Nhện Con Hang Tối", "Bọ Thiết Giáp Đá", "Dơi Quỷ Hút Huyết", "Thạch Quái Nhũ Đá", "Hắc Ma Phù Thủy", "Quỷ Cầm Đao", "Huyết Ma Dạ Xoa", "Cấm Vệ Vực Sâu"]
    ),
  },
  {
    id: "map_underwater",
    name: "Thủy Cung Đáy Biển",
    vietnameseName: "Bản Đồ 4: Thủy Cung Đáy Biển",
    subtitle: "Đại dương sâu thẳm nơi Thủy Quái Leviathan phong ấn",
    description: "Thủy cung cổ đại chìm sâu dưới đáy đại dương. Chiến đấu với Cá Mập Ma, Xà Nữ Siren, Quái Vật Kraken và Thủy Quái Leviathan.",
    theme: "underwater",
    unlocked: true,
    reqLevel: 7,
    colors: {
      floor: "#041726",
      floorGrid: "#0b3553",
      wall: "#062842",
      accent: "#06b6d4",
      fog: "rgba(4, 23, 38, 0.75)",
    },
    weather: "bubbles",
    stages: generate20Stages(
      "Thủy Cung Đáy Biển",
      {
        5: {
          name: "Cá Mập Ma Biển Sâu",
          form: "shark",
          title: "Cá Mập Ma Biển Sâu",
          description: "Hung thần đại dương phóng như tên bắn với hàm răng sắc bén xé toạc làn nước!",
        },
        10: {
          name: "Xà Nữ Thủy Quái Siren",
          form: "siren",
          title: "Xà Nữ Thủy Quái Siren",
          description: "Nữ hoàng bão tố với tiếng hát ma quái và những luồng tiễn sóng thần dữ dội!",
        },
        15: {
          name: "Bạch Tuộc Ma Kraken",
          form: "kraken",
          title: "Bạch Tuộc Ma Kraken",
          description: "Quái vật xúc tu khổng lồ quất dập đại dương và phun mực đen mù mịt!",
        },
        20: {
          name: "Cổ Đại Thủy Quái Leviathan",
          form: "leviathan",
          title: "Cổ Đại Thủy Quái Leviathan (Trùm Cuối)",
          description: "Chúa tể biển sâu Leviathan cầm Đinh Ba Sóng Thần, triệu hồi lốc xoáy nước và đại hồng thủy quét sạch tất cả!",
        },
      },
      ["Sứa Điện Phát Sáng", "Cá Răng Kiếm", "Cua Thiết Giáp", "Mực Ma Trôi Dạt", "Thủy Binh Nỏ Nước", "Hải Xà Biển Sâu", "Xúc Tu Ma Nước", "Kỵ Sĩ Cá Ngựa"]
    ),
  },
];

// 4 Arena Battlegrounds (Đấu Trường Sinh Tử)
export const ARENA_BATTLEGROUNDS: MapConfig[] = [
  {
    id: 'arena_colosseum',
    name: 'Đấu Trường La Mã Cổ',
    vietnameseName: 'Đấu Trường La Mã Cổ',
    subtitle: 'Nơi các đấu sĩ đổ máu vì vinh quang vĩnh cửu',
    description: 'Sàn đấu đá hoa cương tròn bao quanh bởi khán đài rực lửa. Quái vật dồn dập tấn công từ 4 cổng sắt.',
    theme: 'colosseum',
    unlocked: true,
    reqLevel: 1,
    colors: {
      floor: '#1c1917',
      floorGrid: '#3c3530',
      wall: '#292524',
      accent: '#f59e0b',
      fog: 'rgba(28, 25, 23, 0.7)',
    },
    weather: 'blood',
    stages: [
      {
        stageNumber: 1,
        title: 'Đợt 1: Khai Mạc Giác Đấu',
        description: 'Bầy mãnh thú giác đấu đầu tiên ùa vào đấu trường.',
        monsterSpawnCount: 15,
        archetypes: ['swarm', 'brute'],
      },
      {
        stageNumber: 2,
        title: 'Đợt 2: Cung Thủ & Đao Phủ',
        description: 'Sát thủ liên hoàn và xạ thủ trên khán đài.',
        monsterSpawnCount: 20,
        archetypes: ['ranged', 'assassin'],
      },
      {
        stageNumber: 3,
        title: 'Đợt 3: Đấu Sĩ Khổng Lồ',
        description: '2 Mini-boss giác thủ mang chùy sắt nghiền nát.',
        monsterSpawnCount: 22,
        archetypes: ['brute', 'assassin'],
        hasMiniBoss: true,
      },
      {
        stageNumber: 4,
        title: 'Đợt 4: Huyết Lôi Hỗn Chiến',
        description: 'Cơn bão quái vật tràn vào tìm kiếm người sống sót duy nhất.',
        monsterSpawnCount: 28,
        archetypes: ['swarm', 'ranged', 'brute', 'assassin'],
      },
      {
        stageNumber: 5,
        title: 'Đợt 5 (BOSS): QUỶ VƯƠNG GIÁC ĐẤU LA MÃ',
        description: 'Nhà vô địch bất bại của đấu trường cổ đại xuất trận!',
        monsterSpawnCount: 10,
        archetypes: ['brute', 'boss'],
        isBossStage: true,
        bossName: 'Quỷ Vương Giác Đấu La Mã',
      },
    ],
  },
  {
    id: 'arena_lava_pit',
    name: 'Hồ Dung Nham Địa Ngục',
    vietnameseName: 'Hồ Dung Nham Địa Ngục',
    subtitle: 'Sàn đấu nổi bập bềnh giữa dòng dung nham cuồn cuộn',
    description: 'Mỗi bước chân đều bỏng rát. Cơn thịnh nộ của lửa đỏ không cho phép bất kỳ sự do dự nào.',
    theme: 'lava',
    unlocked: true,
    reqLevel: 5,
    colors: {
      floor: '#1f0d0d',
      floorGrid: '#421616',
      wall: '#2e0a0a',
      accent: '#ef4444',
      fog: 'rgba(31, 13, 13, 0.75)',
    },
    weather: 'embers',
    stages: [
      {
        stageNumber: 1,
        title: 'Đợt 1: Hỏa Linh Xung Kích',
        description: 'Lửa bốc cháy xung quanh sàn đấu.',
        monsterSpawnCount: 16,
        archetypes: ['swarm', 'ranged'],
      },
      {
        stageNumber: 2,
        title: 'Đợt 2: Viêm Ma Trảm Kích',
        description: 'Đội quân cầm đại đao rực lửa bao vây.',
        monsterSpawnCount: 22,
        archetypes: ['brute', 'ranged'],
      },
      {
        stageNumber: 3,
        title: 'Đợt 3: Hỏa Ngục Hỗn Mang',
        description: 'Hỏa tiễn và quái thú nham thạch đập đất liên hồi.',
        monsterSpawnCount: 25,
        archetypes: ['assassin', 'brute'],
        hasMiniBoss: true,
      },
      {
        stageNumber: 4,
        title: 'Đợt 4: Biển Lửa Tận Diệt',
        description: 'Lượng quái vật khổng lồ tràn ra từ lòng hồ nham thạch.',
        monsterSpawnCount: 30,
        archetypes: ['swarm', 'assassin', 'brute', 'ranged'],
      },
      {
        stageNumber: 5,
        title: 'Đợt 5 (BOSS): BẠO CHÚA HỎA NGỤC AZAGOR',
        description: 'Chúa tể lửa đỏ thức tỉnh từ tận cùng dung nham!',
        monsterSpawnCount: 10,
        archetypes: ['swarm', 'boss'],
        isBossStage: true,
        bossName: 'Bạo Chúa Hỏa Ngục Azagor',
      },
    ],
  },
];

// 3 Special Events (Sự Kiện Đặc Biệt)
export const SPECIAL_EVENTS: SpecialEvent[] = [
  {
    id: 'event_blood_moon',
    name: 'Đêm Trăng Máu',
    badge: 'HOT x2 RƠI ĐỒ',
    description: 'Ánh trăng đỏ thắm biến toàn bộ quái vật thành cuồng nộ. Tăng gấp đôi tỉ lệ rơi Rương Thần Thoại & EXP!',
    icon: 'Moon',
    bonus: '+100% EXP & Tỉ lệ rớt trang bị Thần Thoại x2',
    mapId: 'map_forest',
    durationText: 'Còn lại: 2 giờ 45 phút',
    dropRateMultiplier: 2.0,
    enemyDmgMultiplier: 1.25,
  },
  {
    id: 'event_tower_of_trials',
    name: 'Tháp Vô Tận Thử Thách',
    badge: 'LEO THÁP',
    description: 'Leo từng tầng tháp vô tận, chiến đấu với các đợt quái ngày một hung bạo để nhận danh hiệu Độc Tôn!',
    icon: 'TrendingUp',
    bonus: 'Phần thưởng Vàng x3 + Mở khóa skin độc quyền',
    mapId: 'map_cave',
    durationText: 'Sự kiện tuần',
    dropRateMultiplier: 1.5,
    enemyDmgMultiplier: 1.15,
  },
  {
    id: 'event_treasure_vault',
    name: 'Kho Báu Yêu Tinh Goblin',
    badge: 'RƯƠNG VÀNG',
    description: 'Yêu tinh mang rương báu trốn chạy khắp chiến trường. Đuổi theo tiêu diệt để mở hàng loạt Rương Vàng!',
    icon: 'Coins',
    bonus: 'Nhặt hàng ngàn Vàng & Rương Vàng liên tục',
    mapId: 'map_desert',
    durationText: 'Mở mỗi ngày',
    dropRateMultiplier: 2.5,
    enemyDmgMultiplier: 0.9,
  },
];

// Permanent Lobby Shop Weapons categorized into 4 tiers
export const LOBBY_SHOP_WEAPONS: LobbyItem[] = [
  // Common (Phổ Thông)
  {
    id: 'wpn_com_1',
    name: 'Thanh Kiếm Tân Thủ',
    type: 'weapon',
    tier: 'common',
    cost: 120,
    stats: { hp: 20, atk: 8, def: 0 },
    description: 'Vũ khí rèn từ sắt cơ bản của tân binh, tăng sát thương bước đầu.',
    icon: 'Sword',
    visualGlow: '#94a3b8',
  },
  {
    id: 'wpn_com_2',
    name: 'Đoản Đao Rèn Sắt',
    type: 'weapon',
    tier: 'common',
    cost: 200,
    stats: { hp: 30, atk: 14, def: 2, critRate: 0.03 },
    description: 'Lưỡi đao sắc bén tăng cường khả năng tấn công nhanh và chí mạng.',
    icon: 'Sword',
    visualGlow: '#cbd5e1',
  },
  // Rare (Hiếm)
  {
    id: 'wpn_rare_1',
    name: 'Huyết Kiếm Cuồng Lang',
    type: 'weapon',
    tier: 'rare',
    cost: 500,
    stats: { hp: 60, atk: 28, def: 4, critRate: 0.05 },
    description: 'Được tôi luyện từ nanh của sói bóng đêm, gia tăng uy lực đáng kể.',
    icon: 'Flame',
    visualGlow: '#38bdf8',
  },
  {
    id: 'wpn_rare_2',
    name: 'Lôi Đình Trọng Kiếm',
    type: 'weapon',
    tier: 'rare',
    cost: 750,
    stats: { hp: 90, atk: 38, def: 8, critRate: 0.06 },
    description: 'Trọng kiếm mang sức mạnh sấm sét, đánh tan phòng thủ của kẻ địch.',
    icon: 'Zap',
    visualGlow: '#60a5fa',
  },
  // Epic (Sử Thi)
  {
    id: 'wpn_epic_1',
    name: 'Hắc Diệt Trảm Đao',
    type: 'weapon',
    tier: 'epic',
    cost: 1400,
    stats: { hp: 160, atk: 60, def: 12, critRate: 0.08 },
    description: 'Đao trảm ma vương chứa năng lượng bóng tối, càn quét cả đàn quái.',
    icon: 'Skull',
    visualGlow: '#a855f7',
  },
  {
    id: 'wpn_epic_2',
    name: 'Băng Long Hàn Nguyệt Kiếm',
    type: 'weapon',
    tier: 'epic',
    cost: 1900,
    stats: { hp: 220, atk: 75, def: 18, critRate: 0.10 },
    description: 'Đúc từ vảy Rồng Băng Tuyết, tỏa hàn khí sắc lạnh xuyên thủng mọi giáp.',
    icon: 'Sparkles',
    visualGlow: '#c084fc',
  },
  // Legendary (Truyền Thuyết)
  {
    id: 'wpn_leg_1',
    name: 'Thần Ma Vô Cực Kiếm',
    type: 'weapon',
    tier: 'legendary',
    cost: 3500,
    stats: { hp: 320, atk: 115, def: 25, critRate: 0.14 },
    description: 'Cổ kiếm huyền thoại phân định sinh tử, uy lực rung chuyển trời đất.',
    icon: 'Crown',
    visualGlow: '#f59e0b',
  },
  {
    id: 'wpn_leg_2',
    name: 'Thái Cổ Long Hồn Đao',
    type: 'weapon',
    tier: 'legendary',
    cost: 5000,
    stats: { hp: 450, atk: 150, def: 35, critRate: 0.18 },
    description: 'Thần khí tối thượng thức tỉnh linh hồn Cổ Long, quét sạch tất cả.',
    icon: 'Award',
    visualGlow: '#fbbf24',
  },
];

// Permanent Lobby Shop Armors categorized into 4 tiers
export const LOBBY_SHOP_ARMORS: LobbyItem[] = [
  // Common (Phổ Thông)
  {
    id: 'arm_com_1',
    name: 'Chiến Bào Da Thợ Săn',
    type: 'armor',
    tier: 'common',
    cost: 100,
    stats: { hp: 50, atk: 0, def: 6 },
    description: 'Giáp da dẻo dai giúp tăng sức bền cơ bản trong chiến đấu.',
    icon: 'Shield',
    visualGlow: '#94a3b8',
  },
  {
    id: 'arm_com_2',
    name: 'Giáp Sắt Rèn Thô',
    type: 'armor',
    tier: 'common',
    cost: 180,
    stats: { hp: 90, atk: 0, def: 10 },
    description: 'Tấm giáp sắt rèn đặc, giảm đáng kể sát thương đòn đánh của quái.',
    icon: 'Shield',
    visualGlow: '#cbd5e1',
  },
  // Rare (Hiếm)
  {
    id: 'arm_rare_1',
    name: 'Khôi Giáp Hắc Báo',
    type: 'armor',
    tier: 'rare',
    cost: 450,
    stats: { hp: 160, atk: 4, def: 18 },
    description: 'Nhẹ nhàng và cứng cáp, mang lại sự linh hoạt cùng độ bảo hộ cao.',
    icon: 'Shield',
    visualGlow: '#38bdf8',
  },
  {
    id: 'arm_rare_2',
    name: 'Chiến Bào Băng Sương',
    type: 'armor',
    tier: 'rare',
    cost: 680,
    stats: { hp: 240, atk: 6, def: 25 },
    description: 'Giáp băng tinh làm chệch hướng các đòn cắn xé của dã thú sa mạc và hang động.',
    icon: 'Shield',
    visualGlow: '#60a5fa',
  },
  // Epic (Sử Thi)
  {
    id: 'arm_epic_1',
    name: 'Thánh Giáp Hộ Mệnh',
    type: 'armor',
    tier: 'epic',
    cost: 1300,
    stats: { hp: 380, atk: 12, def: 38 },
    description: 'Chiến giáp chúc phúc bởi ánh sáng thiên thần, tăng lượng máu lớn.',
    icon: 'ShieldAlert',
    visualGlow: '#a855f7',
  },
  {
    id: 'arm_epic_2',
    name: 'Minh Vương Hắc Bào',
    type: 'armor',
    tier: 'epic',
    cost: 1800,
    stats: { hp: 500, atk: 18, def: 50 },
    description: 'Chiến bào hắc ám hấp thu chấn động, kiên cố trước các đòn dập búa bạo lực.',
    icon: 'ShieldAlert',
    visualGlow: '#c084fc',
  },
  // Legendary (Truyền Thuyết)
  {
    id: 'arm_leg_1',
    name: 'Bất Diệt Long Lân Giáp',
    type: 'armor',
    tier: 'legendary',
    cost: 3200,
    stats: { hp: 750, atk: 25, def: 72 },
    description: 'Đan từ vảy rồng nghìn năm bất hoại, biến nhân vật thành pháo đài thép.',
    icon: 'Crown',
    visualGlow: '#f59e0b',
  },
  {
    id: 'arm_leg_2',
    name: 'Vĩnh Hằng Thiên Giáp',
    type: 'armor',
    tier: 'legendary',
    cost: 4800,
    stats: { hp: 1050, atk: 40, def: 95 },
    description: 'Bộ thiên giáp thần thánh tối cao, hộ mệnh vĩnh cửu trước mọi đại ma vương.',
    icon: 'Award',
    visualGlow: '#fbbf24',
  },
];

// Initial Quest Bounties
export const INITIAL_QUESTS: QuestItem[] = [
  {
    id: 'q_kills_30',
    title: 'Tân Binh Trảm Quái',
    description: 'Tiêu diệt 30 quái vật bất kỳ trong các đợt ải',
    target: 30,
    current: 0,
    completed: false,
    claimed: false,
    rewardGold: 150,
    metric: 'kills',
    icon: 'Skull',
  },
  {
    id: 'q_boss_2',
    title: 'Kẻ Săn Ma Vương',
    description: 'Hạ gục 2 Boss bất kỳ (Ải 5, 10, 15 hoặc 20)',
    target: 2,
    current: 0,
    completed: false,
    claimed: false,
    rewardGold: 250,
    metric: 'boss_kills',
    icon: 'Crown',
  },
  {
    id: 'q_chests_4',
    title: 'Đạo Tặc Kho Báu',
    description: 'Mở 4 hòm rương thần khí sau các ải chiến đấu',
    target: 4,
    current: 0,
    completed: false,
    claimed: false,
    rewardGold: 120,
    metric: 'chests_opened',
    icon: 'Package',
  },
  {
    id: 'q_combo_s',
    title: 'Vũ Điệu Lưỡi Gươm',
    description: 'Đạt chuỗi Combo Rank S (35 đòn trúng liên tiếp) trở lên',
    target: 1,
    current: 0,
    completed: false,
    claimed: false,
    rewardGold: 180,
    metric: 'combo_rank',
    icon: 'Flame',
  },
  {
    id: 'q_dashes_15',
    title: 'Thần Tốc Né Đòn',
    description: 'Thực hiện 15 cú Lướt / Blink né tránh thành công',
    target: 15,
    current: 0,
    completed: false,
    claimed: false,
    rewardGold: 100,
    metric: 'dashes',
    icon: 'Wind',
  },
  {
    id: 'q_ultimates_3',
    title: 'Bậc Thầy Kỹ Năng',
    description: 'Tung Chiêu Cuối (Ultimate) 3 lần trong trận chiến',
    target: 3,
    current: 0,
    completed: false,
    claimed: false,
    rewardGold: 200,
    metric: 'ultimates',
    icon: 'Zap',
  },
  {
    id: 'q_shop_unlock',
    title: 'Thợ Rèn Huyền Thoại',
    description: 'Mở khóa 1 món vũ khí hoặc giáp bất kỳ tại Sảnh Chờ',
    target: 1,
    current: 0,
    completed: false,
    claimed: false,
    rewardGold: 220,
    metric: 'shop_unlocks',
    icon: 'Shield',
  },
  {
    id: 'q_waves_10',
    title: 'Chiến Binh Kiên Cường',
    description: 'Vượt qua ít nhất 10 wave trong một chuyến xuất chiến',
    target: 10,
    current: 0,
    completed: false,
    claimed: false,
    rewardGold: 250,
    metric: 'wave_cleared',
    icon: 'Award',
  },
];

// Wheel Rewards
export const WHEEL_REWARDS: WheelReward[] = [
  { id: 'w1', label: '+80 Vàng', type: 'gold', value: 80, color: '#3b82f6', weight: 28 },
  { id: 'w2', label: '+150 Vàng', type: 'gold', value: 150, color: '#10b981', weight: 22 },
  { id: 'w3', label: '+300 Vàng', type: 'gold', value: 300, color: '#8b5cf6', weight: 14 },
  { id: 'w4', label: '+6 ATK Đan', type: 'stat_atk', value: 6, color: '#f59e0b', weight: 12 },
  { id: 'w5', label: '+50 Max HP', type: 'stat_hp', value: 50, color: '#ec4899', weight: 12 },
  { id: 'w6', label: 'Rương Hiếm', type: 'rare_box', value: 1, color: '#06b6d4', weight: 7 },
  { id: 'w7', label: 'Rương Sử Thi', type: 'epic_box', value: 1, color: '#d946ef', weight: 4 },
  { id: 'w8', label: '★ JACKPOT 888G ★', type: 'jackpot', value: 888, color: '#eab308', weight: 1 },
];

export function calculateWheelCost(spinCount: number): number {
  if (spinCount <= 0) return 50;
  if (spinCount === 1) return 100;
  if (spinCount === 2) return 200;
  if (spinCount === 3) return 350;
  return 500;
}

// Reset in-run temporary chest equipment when entering a new map
export function resetInRunEquipment(): HeroEquipment {
  return createDefaultEquipment();
}
