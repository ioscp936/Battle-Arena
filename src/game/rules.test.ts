import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDamage,
  getComboRank,
  getComboMultiplier,
  calculateExpNext,
  checkLevelUp,
  generateLootItem,
  rollChestLoot,
  applyHeroStats,
  createDefaultOutfits,
  createDefaultEquipment,
  ADVENTURE_MAPS,
  ARENA_BATTLEGROUNDS,
  HERO_CLASSES,
  getDamageVisualInfo,
  calculateWheelCost,
  LOBBY_SHOP_WEAPONS,
  LOBBY_SHOP_ARMORS,
  INITIAL_QUESTS,
  resetInRunEquipment,
} from './rules';

test('calculateDamage applies defense mitigation, crit, and combo multiplier properly', () => {
  const normal = calculateDamage(100, 0, false, 1.75, 1.0);
  assert.ok(normal.damage >= 90 && normal.damage <= 115, `Normal dmg ${normal.damage} out of bounds`);
  assert.equal(normal.isCrit, false);

  const mitigated = calculateDamage(100, 100, false, 1.75, 1.0);
  // Mitigation with 100 def is roughly 50%
  assert.ok(mitigated.damage >= 40 && mitigated.damage <= 60, `Mitigated dmg ${mitigated.damage} out of bounds`);

  const crit = calculateDamage(100, 0, true, 2.0, 1.0);
  assert.equal(crit.isCrit, true);
  assert.ok(crit.damage >= 180, `Crit dmg ${crit.damage} should be >= 180`);

  const withCombo = calculateDamage(100, 0, false, 1.75, 1.5);
  assert.ok(withCombo.damage >= 135, `Combo boosted dmg ${withCombo.damage} should be >= 135`);
});

test('getComboRank & getComboMultiplier progression', () => {
  assert.equal(getComboRank(0), 'D');
  assert.equal(getComboRank(4), 'D');
  assert.equal(getComboRank(5), 'C');
  assert.equal(getComboRank(15), 'B');
  assert.equal(getComboRank(25), 'A');
  assert.equal(getComboRank(40), 'S');
  assert.equal(getComboRank(60), 'SS');
  assert.equal(getComboRank(80), 'SSS');

  assert.equal(getComboMultiplier('D'), 1.00);
  assert.equal(getComboMultiplier('C'), 1.06);
  assert.equal(getComboMultiplier('B'), 1.12);
  assert.equal(getComboMultiplier('A'), 1.20);
  assert.equal(getComboMultiplier('S'), 1.30);
  assert.equal(getComboMultiplier('SS'), 1.45);
  assert.equal(getComboMultiplier('SSS'), 1.60);
});

test('checkLevelUp handles single and multi-level increases', () => {
  const reqLvl1 = calculateExpNext(1);
  assert.ok(reqLvl1 > 0);

  const noLevel = checkLevelUp(reqLvl1 - 10, 1);
  assert.equal(noLevel.leveledUp, false);
  assert.equal(noLevel.newLevel, 1);

  const levelUp = checkLevelUp(reqLvl1 + 50, 1);
  assert.equal(levelUp.leveledUp, true);
  assert.equal(levelUp.newLevel, 2);
  assert.equal(levelUp.remainingExp, 50);
});

test('generateLootItem produces valid item with stats and rarity', () => {
  const sword = generateLootItem('weapon', 'epic', 5);
  assert.equal(sword.type, 'weapon');
  assert.equal(sword.rarity, 'epic');
  assert.ok(sword.stats.atk && sword.stats.atk > 0);
  assert.ok(sword.name.length > 0);
});

test('rollChestLoot drops items and gold appropriately for regular and boss stages', () => {
  const regularLoot = rollChestLoot(1, 0, false);
  assert.ok(regularLoot.items.length >= 1);
  assert.ok(regularLoot.gold > 0);

  const bossLoot = rollChestLoot(5, 0, true);
  assert.ok(bossLoot.items.length >= 2);
  assert.ok(['rare', 'epic', 'legendary', 'mythic'].includes(bossLoot.tier));
});

test('applyHeroStats sets starting base stats to 250 HP and 20 ATK and scales with gear and outfits', () => {
  const outfits = createDefaultOutfits();
  const defaultOutfit = outfits[0];
  const equipment = createDefaultEquipment();

  const stats = applyHeroStats(1, equipment, defaultOutfit);
  assert.equal(stats.maxHp, 250, `Starting Hero HP should be 250, got ${stats.maxHp}`);
  assert.equal(stats.atk, 20, `Starting Hero ATK should be 20, got ${stats.atk}`);
  assert.ok(stats.def >= 10);
  assert.ok(stats.speed >= 200);

  // Compare with Crimson Dragon outfit (more ATK)
  const dragonOutfit = outfits.find(o => o.id === 'outfit_crimson_dragon')!;
  const dragonStats = applyHeroStats(1, equipment, dragonOutfit);
  assert.ok(dragonStats.atk > stats.atk);
});

test('ADVENTURE_MAPS contains exactly 4 maps (forest, desert, cave, underwater) each with 20 waves and Bosses every 5 waves', () => {
  assert.equal(ADVENTURE_MAPS.length, 4);
  const mapIds = ADVENTURE_MAPS.map(m => m.id);
  assert.deepEqual(mapIds, ['map_forest', 'map_desert', 'map_cave', 'map_underwater']);

  for (const map of ADVENTURE_MAPS) {
    assert.equal(map.stages.length, 20, `Map ${map.name} must have 20 stages`);
    // Waves 5, 10, 15, 20 must be boss stages
    for (const waveNum of [5, 10, 15, 20]) {
      const bossStage = map.stages[waveNum - 1];
      assert.equal(bossStage.stageNumber, waveNum);
      assert.equal(bossStage.isBossStage, true, `Wave ${waveNum} in ${map.name} must be a Boss stage`);
      assert.ok(bossStage.bossName && bossStage.bossName.length > 0);
      assert.ok(bossStage.bossForm && bossStage.bossForm.length > 0);
    }
  }

  // Verify requested distinct boss forms
  const forestMap = ADVENTURE_MAPS.find(m => m.id === 'map_forest')!;
  assert.equal(forestMap.stages[19].bossForm, 'dragon', 'Map forest final boss must be dragon');

  const desertMap = ADVENTURE_MAPS.find(m => m.id === 'map_desert')!;
  assert.equal(desertMap.stages[9].bossForm, 'skeleton', 'Map desert wave 10 boss must be skeleton');
  assert.equal(desertMap.stages[14].bossForm, 'mummy', 'Map desert wave 15 boss must be mummy');

  const caveMap = ADVENTURE_MAPS.find(m => m.id === 'map_cave')!;
  assert.equal(caveMap.stages[14].bossForm, 'demon', 'Map cave wave 15 boss must be demon');
  assert.equal(caveMap.stages[19].bossForm, 'overlord', 'Map cave final boss must be overlord demon');

  const underwaterMap = ADVENTURE_MAPS.find(m => m.id === 'map_underwater')!;
  assert.equal(underwaterMap.stages[19].bossForm, 'leviathan', 'Map underwater final boss must be leviathan sea monster');
});

test('HERO_CLASSES provides 5 distinct classes with unique skills and playstyles', () => {
  assert.equal(HERO_CLASSES.length, 5);
  const ids = HERO_CLASSES.map(c => c.id);
  assert.deepEqual(ids, ['warrior', 'mage', 'assassin', 'ranger', 'paladin']);

  for (const heroClass of HERO_CLASSES) {
    assert.ok(heroClass.name.length > 0);
    assert.ok(heroClass.skills.basic.name.length > 0);
    assert.ok(heroClass.skills.skill1.name.length > 0);
    assert.ok(heroClass.skills.skill2.name.length > 0);
    assert.ok(heroClass.skills.skill3.name.length > 0);
    assert.ok(heroClass.skills.ultimate.name.length > 0);
  }

  // Paladin has higher HP than Mage
  const paladin = HERO_CLASSES.find(c => c.id === 'paladin')!;
  const mage = HERO_CLASSES.find(c => c.id === 'mage')!;
  assert.ok(paladin.baseStatsBonus.hp > mage.baseStatsBonus.hp);
});

test('getDamageVisualInfo differentiates normal hits, critical hits, super crits, and healing', () => {
  // Normal hit
  const normal = getDamageVisualInfo(85, false, 'D');
  assert.equal(normal.isCrit, false);
  assert.equal(normal.fontSize, 19);
  assert.equal(normal.textColor, '#ffffff');
  assert.equal(normal.badge, undefined);

  // Critical hit (standard)
  const crit = getDamageVisualInfo(120, true, 'B');
  assert.equal(crit.isCrit, true);
  assert.ok(crit.fontSize >= 28);
  assert.equal(crit.textColor, '#facc15');
  assert.ok(crit.badge?.includes('BẠO KÍCH'));
  assert.ok(crit.scaleStart > normal.scaleStart);

  // Super Critical hit (Rank SSS or >= 250 dmg)
  const superCrit = getDamageVisualInfo(350, true, 'SSS');
  assert.equal(superCrit.isCrit, true);
  assert.equal(superCrit.fontSize, 34);
  assert.ok(superCrit.badge?.includes('SIÊU CẤP'));
  assert.ok(superCrit.scaleStart >= 2.0);

  // Player damage
  const playerDmg = getDamageVisualInfo(40, false, 'D', true);
  assert.equal(playerDmg.text, '-40');
  assert.equal(playerDmg.textColor, '#f87171');

  // Healing
  const heal = getDamageVisualInfo(60, false, 'D', false, true);
  assert.equal(heal.text, '+60');
  assert.equal(heal.textColor, '#4ade80');
});

test('calculateWheelCost scales with number of spins', () => {
  assert.equal(calculateWheelCost(0), 50);
  assert.equal(calculateWheelCost(1), 100);
  assert.equal(calculateWheelCost(2), 200);
  assert.equal(calculateWheelCost(3), 350);
  assert.equal(calculateWheelCost(4), 500);
  assert.ok(calculateWheelCost(5) >= 500);
});

test('LOBBY_SHOP items are divided into common, rare, epic, legendary with increasing gold costs', () => {
  assert.ok(LOBBY_SHOP_WEAPONS.length >= 8);
  assert.ok(LOBBY_SHOP_ARMORS.length >= 8);

  const tiers = ['common', 'rare', 'epic', 'legendary'];
  for (const tier of tiers) {
    const wpn = LOBBY_SHOP_WEAPONS.find((w) => w.tier === tier);
    const arm = LOBBY_SHOP_ARMORS.find((a) => a.tier === tier);
    assert.ok(wpn, `Weapon for tier ${tier} should exist`);
    assert.ok(arm, `Armor for tier ${tier} should exist`);
  }

  // Cost scaling check: Common < Rare < Epic < Legendary
  const comWpn = LOBBY_SHOP_WEAPONS.find((w) => w.tier === 'common')!;
  const rareWpn = LOBBY_SHOP_WEAPONS.find((w) => w.tier === 'rare')!;
  const epicWpn = LOBBY_SHOP_WEAPONS.find((w) => w.tier === 'epic')!;
  const legWpn = LOBBY_SHOP_WEAPONS.find((w) => w.tier === 'legendary')!;

  assert.ok(comWpn.cost < rareWpn.cost, 'Rare must cost more than Common');
  assert.ok(rareWpn.cost < epicWpn.cost, 'Epic must cost more than Rare');
  assert.ok(epicWpn.cost < legWpn.cost, 'Legendary must cost more than Epic');
});

test('INITIAL_QUESTS provides rewarding gold bounties for gameplay achievements', () => {
  assert.ok(INITIAL_QUESTS.length >= 8);

  for (const quest of INITIAL_QUESTS) {
    assert.ok(quest.title.length > 0);
    assert.ok(quest.target > 0);
    assert.ok(quest.rewardGold > 0, `Quest ${quest.title} must award gold`);
    assert.equal(quest.claimed, false);
    assert.equal(quest.completed, false);
  }
});

test('resetInRunEquipment resets run equipment back to default starter gear', () => {
  const emptyGear = resetInRunEquipment();
  assert.equal(emptyGear.weapon?.id, 'item_starter_sword');
  assert.equal(emptyGear.armor?.id, 'item_starter_armor');
  assert.equal(emptyGear.helmet, null);
  assert.equal(emptyGear.ring, null);
  assert.equal(emptyGear.relic, null);
});

test('applyHeroStats with lobbyEquipment permanently augments hero base stats', () => {
  const defaultGear = createDefaultEquipment();
  const defaultOutfit = createDefaultOutfits()[0];
  const warrior = HERO_CLASSES[0];

  const baseStats = applyHeroStats(1, defaultGear, defaultOutfit, warrior);
  
  // Equip legendary lobby weapon & armor
  const legWpn = LOBBY_SHOP_WEAPONS.find((w) => w.tier === 'legendary')!;
  const legArm = LOBBY_SHOP_ARMORS.find((a) => a.tier === 'legendary')!;
  const withLobbyGear = applyHeroStats(1, defaultGear, defaultOutfit, warrior, {
    weapon: legWpn,
    armor: legArm,
  });

  assert.ok(withLobbyGear.atk > baseStats.atk, 'Legendary lobby weapon must increase ATK');
  assert.ok(withLobbyGear.maxHp > baseStats.maxHp, 'Legendary lobby armor must increase max HP');
});

