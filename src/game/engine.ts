import {
  ChestEntity,
  ComboRank,
  ComboState,
  DamageNumber,
  HeroClass,
  HeroEquipment,
  HeroStats,
  MapConfig,
  Monster,
  MonsterArchetype,
  Outfit,
  Particle,
  Projectile,
} from './types';
import { calculateDamage, getComboMultiplier, getComboRank, rollChestLoot, HERO_CLASSES, getDamageVisualInfo } from './rules';
import { sounds } from './audio';

export interface GameEngineCallbacks {
  onHeroStatsChange: (stats: HeroStats) => void;
  onComboChange: (combo: ComboState) => void;
  onBossHpChange: (boss: Monster | null) => void;
  onStageClear: (chest: ChestEntity) => void;
  onGameOver: (stats: { stageNumber: number; maxCombo: number; totalKills: number }) => void;
  onChestInteract: (chest: ChestEntity) => void;
  onSkillCooldownsChange: (cds: { dash: number; whirlwind: number; inferno: number; ultimate: number }) => void;
  onLevelExpChange: (level: number, exp: number, expNext: number, goldGained: number) => void;
  onMonsterKilled?: (isBoss: boolean) => void;
  onSkillUsed?: (skill: 'dash' | 'whirlwind' | 'inferno' | 'ultimate') => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Arena & Map
  public mapConfig: MapConfig;
  public stageIndex: number = 0; // 0 to 4
  public arenaWidth: number = 1600;
  public arenaHeight: number = 1200;

  // Hero state
  public heroX: number = 800;
  public heroY: number = 600;
  public heroFacing: number = 0; // radians
  public heroStats: HeroStats;
  public heroLevel: number = 1;
  public heroExp: number = 0;
  public heroEquipment: HeroEquipment;
  public activeOutfit: Outfit;
  public heroClass: HeroClass;

  // Attack & Skills
  public attackTimer: number = 0;
  public attackIndex: number = 0;
  public isAttacking: boolean = false;
  public attackHitboxActive: boolean = false;
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public dashVx: number = 0;
  public dashVy: number = 0;
  public invulnerableTimer: number = 1.8;

  // Skill cooldowns (remaining seconds)
  public cdWhirlwind: number = 0; // Skill 2
  public cdInferno: number = 0; // Skill 3
  public cdUltimate: number = 0; // Ultimate
  public cdDash: number = 0; // Skill 1

  public isWhirlwinding: boolean = false;
  public whirlwindTimer: number = 0;

  // Combo
  public combo: ComboState = {
    hits: 0,
    maxHits: 0,
    rank: 'D',
    multiplier: 1.0,
    timer: 0,
    maxTimer: 3.5,
    totalDamage: 0,
  };

  // Entities
  public monsters: Monster[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];
  public chest: ChestEntity | null = null;
  public activeBoss: Monster | null = null;

  // Juice & FX
  public screenShake: number = 0;
  public hitstopTimer: number = 0;
  public cameraX: number = 800;
  public cameraY: number = 600;
  public animationTick: number = 0;

  // Total run statistics
  public totalKills: number = 0;
  public maxComboEver: number = 0;

  // Input state
  public keys: Set<string> = new Set();
  public mouseX: number = 0;
  public mouseY: number = 0;
  public isMouseDown: boolean = false;

  // Loop control
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private isPaused: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    mapConfig: MapConfig,
    stageIndex: number,
    heroStats: HeroStats,
    heroEquipment: HeroEquipment,
    activeOutfit: Outfit,
    heroClass: HeroClass,
    heroLevel: number,
    heroExp: number,
    callbacks: GameEngineCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.mapConfig = mapConfig;
    this.stageIndex = stageIndex;
    this.heroStats = { ...heroStats };
    this.heroEquipment = heroEquipment;
    this.activeOutfit = activeOutfit;
    this.heroClass = heroClass || HERO_CLASSES[0];
    this.heroLevel = heroLevel;
    this.heroExp = heroExp;
    this.callbacks = callbacks;

    this.initStage();
  }

  public initStage() {
    this.monsters = [];
    this.projectiles = [];
    this.chest = null;
    this.activeBoss = null;
    this.heroX = this.arenaWidth / 2;
    this.heroY = this.arenaHeight / 2 + 100;
    this.cameraX = this.heroX;
    this.cameraY = this.heroY;
    this.invulnerableTimer = 2.0; // Grace period on round start

    const currentStage = this.mapConfig.stages[this.stageIndex];
    const isBossStage = currentStage.isBossStage || false;

    // Spawn regular monsters in a circle around arena
    const count = currentStage.monsterSpawnCount;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 380 + Math.random() * 260;
      const mx = Math.max(100, Math.min(this.arenaWidth - 100, this.heroX + Math.cos(angle) * dist));
      const my = Math.max(100, Math.min(this.arenaHeight - 100, this.heroY + Math.sin(angle) * dist));

      const archetype =
        currentStage.archetypes[Math.floor(Math.random() * currentStage.archetypes.length)] || 'swarm';
      if (archetype !== 'boss') {
        this.spawnMonster(mx, my, archetype, false);
      }
    }

    // Spawn Boss if it is a boss stage
    if (isBossStage) {
      const bossX = this.arenaWidth / 2;
      const bossY = this.arenaHeight / 2 - 250;
      const boss = this.spawnMonster(bossX, bossY, 'boss', true);
      this.activeBoss = boss;
      sounds.playBossRoar();
      this.callbacks.onBossHpChange(boss);
    } else {
      this.callbacks.onBossHpChange(null);
    }
  }

  private spawnMonster(x: number, y: number, archetype: MonsterArchetype, isBoss: boolean): Monster {
    const currentStage = this.mapConfig.stages[this.stageIndex];
    const waveFactor = 1 + (this.stageIndex / 20) * 1.4;

    let hp = 45 * waveFactor;
    let atk = 18 * waveFactor;
    let def = 3 * waveFactor;
    let speed = 90;
    let radius = 22;
    let color = '#ef4444';
    let accentColor = '#fca5a5';
    let name = 'Quái Vật';
    const theme = this.mapConfig.theme;

    if (archetype === 'swarm') {
      name =
        theme === 'forest'
          ? 'Sói Hoang Rừng Sâu'
          : theme === 'desert'
          ? 'Bọ Cát Sa Mạc'
          : theme === 'cave'
          ? 'Nhện Con Hang Tối'
          : 'Cá Ăn Thịt Biển Sâu';
      hp = 38 * waveFactor;
      atk = 18 * waveFactor;
      speed = 130;
      radius = 18;
      color = this.mapConfig.colors.accent;
      accentColor = '#fef08a';
    } else if (archetype === 'ranged') {
      name =
        theme === 'forest'
          ? 'Cung Thủ Rừng Già'
          : theme === 'desert'
          ? 'Cung Thủ Xương Khô'
          : theme === 'cave'
          ? 'Hắc Ma Phù Thủy'
          : 'Thủy Binh Nỏ Nước';
      hp = 44 * waveFactor;
      atk = 24 * waveFactor;
      speed = 85;
      radius = 20;
      color = '#38bdf8';
      accentColor = '#7dd3fc';
    } else if (archetype === 'brute') {
      name =
        theme === 'forest'
          ? 'Yêu Tinh Rễ Cây'
          : theme === 'desert'
          ? 'Hộ Vệ Lăng Mộ'
          : theme === 'cave'
          ? 'Thạch Quái Obsidian'
          : 'Cua Thiết Giáp Biển Sâu';
      hp = 95 * waveFactor;
      atk = 34 * waveFactor;
      def = 8 * waveFactor;
      speed = 70;
      radius = 32;
      color = '#78350f';
      accentColor = '#d97706';
    } else if (archetype === 'assassin') {
      name =
        theme === 'forest'
          ? 'Sát Thủ Cành Gai'
          : theme === 'desert'
          ? 'Ma Cát Vong Hồn'
          : theme === 'cave'
          ? 'Huyết Ma Dạ Xoa'
          : 'Xà Nữ Hải Quái';
      hp = 52 * waveFactor;
      atk = 28 * waveFactor;
      speed = 155;
      radius = 20;
      color = '#a855f7';
      accentColor = '#e9d5ff';
    }

    let bossForm = isBoss ? currentStage?.bossForm || 'demon' : undefined;

    if (isBoss) {
      name = currentStage?.bossName || 'Đại Ma Vương';
      // Progressive boss HP: wave 5 (~650), wave 10 (~1250), wave 15 (~2000), wave 20 (~3200)
      const bossTier = Math.min(4, Math.max(1, Math.floor((this.stageIndex + 1) / 5)));
      hp = 650 * Math.pow(1.7, bossTier - 1);
      // Quái đánh đau hơn nhiều: Boss deal heavy damage (38 - 78 ATK), taking 15-30% of hero HP per strike!
      atk = 38 + bossTier * 10;
      def = 8 + bossTier * 4;
      speed = 85 + bossTier * 4;
      radius = 54 + (bossTier >= 4 ? 12 : 0);

      if (bossForm === 'dragon') {
        color = '#065f46';
        accentColor = '#34d399';
      } else if (bossForm === 'skeleton') {
        color = '#334155';
        accentColor = '#38bdf8';
      } else if (bossForm === 'mummy') {
        color = '#78350f';
        accentColor = '#fbbf24';
      } else if (bossForm === 'anubis') {
        color = '#1e1b4b';
        accentColor = '#c084fc';
      } else if (bossForm === 'spider') {
        color = '#18181b';
        accentColor = '#4ade80';
      } else if (bossForm === 'golem') {
        color = '#292524';
        accentColor = '#f97316';
      } else if (bossForm === 'hydra') {
        color = '#064e3b';
        accentColor = '#10b981';
      } else if (bossForm === 'treant') {
        color = '#3f2e18';
        accentColor = '#84cc16';
      } else if (bossForm === 'scorpion') {
        color = '#701a75';
        accentColor = '#f43f5e';
      } else if (bossForm === 'shark') {
        color = '#0c4a6e';
        accentColor = '#38bdf8';
      } else if (bossForm === 'siren') {
        color = '#083344';
        accentColor = '#2dd4bf';
      } else if (bossForm === 'kraken') {
        color = '#3b0764';
        accentColor = '#c084fc';
      } else if (bossForm === 'leviathan') {
        color = '#0f172a';
        accentColor = '#06b6d4';
      } else if (bossForm === 'wolf') {
        color = '#1e293b';
        accentColor = '#f43f5e';
      } else {
        color = '#991b1b';
        accentColor = '#facc15';
      }
    }

    const monster: Monster = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      archetype,
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      hp: Math.round(hp),
      maxHp: Math.round(hp),
      atk: Math.round(atk),
      def: Math.round(def),
      speed,
      facing: 0,
      state: 'chase',
      stateTimer: 0,
      attackCooldown: 1.5 + Math.random() * 0.8,
      attackRange: archetype === 'ranged' ? 360 : isBoss ? 110 : 50,
      attackTelegraphMax: isBoss ? 0.7 : 0.45,
      attackTelegraphTimer: 0,
      isBoss,
      bossPhase: 1,
      bossSkillsTimer: 0,
      bossForm,
      color,
      accentColor,
      xpValue: Math.round(hp * 0.3),
      goldValue: Math.round(isBoss ? 200 : 15 + Math.random() * 10),
      dropBonus: isBoss ? 2.5 : 1.0,
      animationTick: Math.random() * 10,
    };

    this.monsters.push(monster);
    return monster;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (!paused) {
      this.lastTime = performance.now();
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // Input event triggers
  public handleKeyDown(code: string) {
    this.keys.add(code);

    if (code === 'KeyJ') {
      this.triggerAttack();
    } else if (code === 'Space' || code === 'KeyK' || code === 'Digit1') {
      if (this.chest && this.isNearChest()) {
        this.openChest();
      } else {
        this.triggerDash();
      }
    } else if (code === 'KeyL' || code === 'Digit2') {
      this.triggerWhirlwind();
    } else if (code === 'KeyI' || code === 'Digit3') {
      this.triggerInferno();
    } else if (code === 'KeyU' || code === 'Digit4') {
      this.triggerUltimate();
    } else if (code === 'KeyE') {
      if (this.chest && this.isNearChest()) {
        this.openChest();
      }
    }
  }

  public handleKeyUp(code: string) {
    this.keys.delete(code);
  }

  // Touch & Mobile Virtual Joystick Support
  public virtualJoystickX: number = 0;
  public virtualJoystickY: number = 0;
  public isTouchDevice: boolean = false;
  public hasRecentMouseMove: boolean = false;

  public setVirtualJoystick(dx: number, dy: number) {
    this.virtualJoystickX = dx;
    this.virtualJoystickY = dy;
    this.isTouchDevice = true;
    this.hasRecentMouseMove = false;
  }

  public getNearestMonster(): Monster | null {
    let nearest: Monster | null = null;
    let minD = Infinity;
    for (const m of this.monsters) {
      if (m.state === 'dead') continue;
      const d = Math.hypot(m.x - this.heroX, m.y - this.heroY);
      if (d < minD) {
        minD = d;
        nearest = m;
      }
    }
    return nearest;
  }

  public handleMouseMove(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = clientX - rect.left;
    this.mouseY = clientY - rect.top;
    this.hasRecentMouseMove = true;
  }

  public handleMouseDown() {
    this.isMouseDown = true;
    if (this.chest && this.isNearChest()) {
      this.openChest();
    } else {
      this.triggerAttack();
    }
  }

  public handleMouseUp() {
    this.isMouseDown = false;
  }

  private isNearChest(): boolean {
    if (!this.chest) return false;
    const dx = this.heroX - this.chest.x;
    const dy = this.heroY - this.chest.y;
    return Math.hypot(dx, dy) < 95;
  }

  // Player Attack Trigger (Class Adaptive & Auto-Aiming for Mobile)
  public triggerAttack() {
    if (this.isAttacking || this.isDashing || this.isWhirlwinding) return;

    this.isAttacking = true;
    this.attackTimer = 0.22;
    this.attackHitboxActive = true;
    this.attackIndex = (this.attackIndex + 1) % 3;

    sounds.playSlash(1.0 + this.attackIndex * 0.15);

    // Aim toward nearest monster on mobile touch, or aim toward mouse on PC
    if (this.isTouchDevice || !this.hasRecentMouseMove) {
      const nearest = this.getNearestMonster();
      if (nearest) {
        this.heroFacing = Math.atan2(nearest.y - this.heroY, nearest.x - this.heroX);
      } else if (Math.hypot(this.virtualJoystickX, this.virtualJoystickY) > 0.1) {
        this.heroFacing = Math.atan2(this.virtualJoystickY, this.virtualJoystickX);
      } else {
        const worldMouseX = this.mouseX - this.canvas.width / 2 + this.cameraX;
        const worldMouseY = this.mouseY - this.canvas.height / 2 + this.cameraY;
        this.heroFacing = Math.atan2(worldMouseY - this.heroY, worldMouseX - this.heroX);
      }
    } else {
      const worldMouseX = this.mouseX - this.canvas.width / 2 + this.cameraX;
      const worldMouseY = this.mouseY - this.canvas.height / 2 + this.cameraY;
      this.heroFacing = Math.atan2(worldMouseY - this.heroY, worldMouseX - this.heroX);
    }

    // Class specific attack behavior
    const attackType = this.heroClass.attackType;

    if (attackType === 'ranged_magic') {
      // Mage fires Arcane Fireball projectile
      const speed = 440;
      this.projectiles.push({
        id: `p_mage_${Date.now()}_${Math.random()}`,
        x: this.heroX + Math.cos(this.heroFacing) * 25,
        y: this.heroY + Math.sin(this.heroFacing) * 25,
        vx: Math.cos(this.heroFacing) * speed,
        vy: Math.sin(this.heroFacing) * speed,
        radius: 12,
        damage: this.heroStats.atk * 1.15,
        isEnemy: false,
        color: '#38bdf8',
        life: 1.4,
        maxLife: 1.4,
        type: 'fireball',
      });
    } else if (attackType === 'ranged_physical') {
      // Ranger shoots piercing arrow
      const speed = 620;
      this.projectiles.push({
        id: `p_ranger_${Date.now()}_${Math.random()}`,
        x: this.heroX + Math.cos(this.heroFacing) * 25,
        y: this.heroY + Math.sin(this.heroFacing) * 25,
        vx: Math.cos(this.heroFacing) * speed,
        vy: Math.sin(this.heroFacing) * speed,
        radius: 7,
        damage: this.heroStats.atk * 1.05,
        isEnemy: false,
        color: '#a3e635',
        life: 1.2,
        maxLife: 1.2,
        pierce: 2,
        type: 'arrow',
      });
    } else if (attackType === 'fast_melee') {
      // Assassin double fast slash
      const lungeDist = 24;
      this.heroX += Math.cos(this.heroFacing) * lungeDist;
      this.heroY += Math.sin(this.heroFacing) * lungeDist;
      this.performPlayerMeleeAttack(this.heroFacing, 75, Math.PI * 0.75, 0.95);
      setTimeout(() => {
        this.performPlayerMeleeAttack(this.heroFacing, 85, Math.PI * 0.75, 1.1);
      }, 70);
    } else if (attackType === 'tank_melee') {
      // Paladin holy hammer slam
      const lungeDist = 14;
      this.heroX += Math.cos(this.heroFacing) * lungeDist;
      this.heroY += Math.sin(this.heroFacing) * lungeDist;
      this.performPlayerMeleeAttack(this.heroFacing, 95, Math.PI * 0.8, 1.25);
    } else {
      // Warrior heavy broad greatsword sweep
      const lungeDist = 18;
      this.heroX += Math.cos(this.heroFacing) * lungeDist;
      this.heroY += Math.sin(this.heroFacing) * lungeDist;
      this.performPlayerMeleeAttack(this.heroFacing, 90, Math.PI * 0.7, 1.0 + this.attackIndex * 0.2);
    }
  }

  // Skill 1: Dash / Blink / Tumble (Class Adaptive)
  public triggerDash() {
    if (this.cdDash > 0 || this.isDashing) return;
    this.cdDash = this.heroClass.skills.skill1.cooldown || 1.2;
    this.invulnerableTimer = 0.28;
    this.callbacks.onSkillUsed?.('dash');

    sounds.playDash();

    // Movement angle
    let dx = 0;
    let dy = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;

    let moveAngle = this.heroFacing;
    if (dx !== 0 || dy !== 0) {
      moveAngle = Math.atan2(dy, dx);
    } else if (Math.hypot(this.virtualJoystickX, this.virtualJoystickY) > 0.1) {
      moveAngle = Math.atan2(this.virtualJoystickY, this.virtualJoystickX);
    }

    if (this.heroClass.id === 'mage') {
      // Mage Blink Teleport!
      const teleportDist = 220;
      const targetX = Math.max(50, Math.min(this.arenaWidth - 50, this.heroX + Math.cos(moveAngle) * teleportDist));
      const targetY = Math.max(50, Math.min(this.arenaHeight - 50, this.heroY + Math.sin(moveAngle) * teleportDist));

      // Spawn Frost Nova particles at departure
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        this.particles.push({
          x: this.heroX,
          y: this.heroY,
          vx: Math.cos(angle) * 160,
          vy: Math.sin(angle) * 160,
          size: 9,
          color: '#38bdf8',
          alpha: 1.0,
          life: 0.35,
          maxLife: 0.35,
          shape: 'snow',
        });
      }

      this.heroX = targetX;
      this.heroY = targetY;
      this.performAreaAttack(this.heroX, this.heroY, 90, 0.7);
    } else {
      this.isDashing = true;
      this.dashTimer = 0.20;
      const dashSpeed = this.heroClass.id === 'assassin' ? 680 : 560;
      this.dashVx = Math.cos(moveAngle) * dashSpeed;
      this.dashVy = Math.sin(moveAngle) * dashSpeed;
      this.heroFacing = moveAngle;

      // Shadow trail
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: this.heroX + (Math.random() - 0.5) * 20,
          y: this.heroY + (Math.random() - 0.5) * 20,
          vx: -this.dashVx * 0.15,
          vy: -this.dashVy * 0.15,
          size: 14,
          color: this.heroClass.visuals.slashColor,
          alpha: 0.8,
          life: 0.25,
          maxLife: 0.25,
        });
      }

      this.performPlayerMeleeAttack(moveAngle, 80, Math.PI, 0.8);
    }
  }

  // Skill 2: Whirlwind / Blizzard / Shurikens / Rain of Arrows / Holy Radiance
  public triggerWhirlwind() {
    if (this.cdWhirlwind > 0 || this.isWhirlwinding) return;
    this.cdWhirlwind = this.heroClass.skills.skill2.cooldown || 4.5;
    this.callbacks.onSkillUsed?.('whirlwind');

    if (this.heroClass.id === 'mage') {
      // Blizzard Nova: freezes area
      sounds.playWhirlwind();
      this.performAreaAttack(this.heroX, this.heroY, 180, 1.4);
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 180;
        this.particles.push({
          x: this.heroX + Math.cos(angle) * dist,
          y: this.heroY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 60,
          vy: 80 + Math.random() * 80,
          size: 7,
          color: '#bae6fd',
          alpha: 1.0,
          life: 0.5,
          maxLife: 0.5,
          shape: 'snow',
        });
      }
    } else if (this.heroClass.id === 'ranger') {
      // Rain of Arrows
      sounds.playWhirlwind();
      const worldMouseX = this.mouseX - this.canvas.width / 2 + this.cameraX;
      const worldMouseY = this.mouseY - this.canvas.height / 2 + this.cameraY;
      this.performAreaAttack(worldMouseX, worldMouseY, 160, 1.6);
      for (let i = 0; i < 30; i++) {
        this.particles.push({
          x: worldMouseX + (Math.random() - 0.5) * 160,
          y: worldMouseY - 200,
          vx: (Math.random() - 0.5) * 30,
          vy: 550,
          size: 6,
          color: '#84cc16',
          alpha: 1.0,
          life: 0.4,
          maxLife: 0.4,
          shape: 'spark',
        });
      }
    } else if (this.heroClass.id === 'assassin') {
      // 8 Shurikens 360 degrees
      sounds.playSlash(1.5);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        this.projectiles.push({
          id: `p_shuriken_${Date.now()}_${i}`,
          x: this.heroX,
          y: this.heroY,
          vx: Math.cos(angle) * 450,
          vy: Math.sin(angle) * 450,
          radius: 9,
          damage: this.heroStats.atk * 0.85,
          isEnemy: false,
          color: '#10b981',
          life: 0.9,
          maxLife: 0.9,
          type: 'shuriken',
        });
      }
    } else if (this.heroClass.id === 'paladin') {
      // Holy Radiance: Heal 18% HP + burn nearby enemies
      sounds.playLevelUp();
      const healAmount = Math.round(this.heroStats.maxHp * 0.18);
      this.heroStats.hp = Math.min(this.heroStats.maxHp, this.heroStats.hp + healAmount);
      this.callbacks.onHeroStatsChange(this.heroStats);

      const healVis = getDamageVisualInfo(healAmount, false, 'D', false, true);
      this.damageNumbers.push({
        id: `heal_${Date.now()}_${Math.random()}`,
        x: this.heroX + (Math.random() - 0.5) * 16,
        y: this.heroY - 32,
        vx: healVis.vx,
        vy: healVis.vy,
        text: healVis.text,
        isCrit: false,
        isPlayer: false,
        life: healVis.duration,
        maxLife: healVis.duration,
        color: healVis.textColor,
        strokeColor: healVis.strokeColor,
        glowColor: healVis.glowColor,
        fontSize: healVis.fontSize,
        scaleStart: healVis.scaleStart,
        type: 'heal',
      });

      this.performAreaAttack(this.heroX, this.heroY, 170, 1.3);

      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        this.particles.push({
          x: this.heroX + Math.cos(angle) * 80,
          y: this.heroY + Math.sin(angle) * 80,
          vx: Math.cos(angle) * 120,
          vy: Math.sin(angle) * 120,
          size: 10,
          color: '#facc15',
          alpha: 1.0,
          life: 0.5,
          maxLife: 0.5,
          shape: 'spark',
        });
      }
    } else {
      // Warrior Whirlwind pull
      this.isWhirlwinding = true;
      this.whirlwindTimer = 1.0;
      sounds.playWhirlwind();

      const pullRadius = 160;
      for (const m of this.monsters) {
        const dist = Math.hypot(m.x - this.heroX, m.y - this.heroY);
        if (dist < pullRadius) {
          const pullAngle = Math.atan2(this.heroY - m.y, this.heroX - m.x);
          m.vx += Math.cos(pullAngle) * 220;
          m.vy += Math.sin(pullAngle) * 220;
        }
      }
    }
  }

  // Skill 3: Class Role-Specific Special Skill
  public triggerInferno() {
    if (this.cdInferno > 0) return;
    this.cdInferno = this.heroClass.skills.skill3.cooldown || 6.0;
    this.callbacks.onSkillUsed?.('inferno');
    sounds.playExplosion();
    this.screenShake = 14;

    const role = this.heroClass.id;

    if (role === 'mage') {
      // Chain Lightning (Sét Giật Thiên Phạt): Zaps up to 5 enemies with electric arcs
      const blastRadius = 240;
      this.performAreaAttack(this.heroX, this.heroY, blastRadius, 2.2);

      // Electric spark arcs
      for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        const dist = 50 + Math.random() * 180;
        this.particles.push({
          x: this.heroX + Math.cos(angle) * dist,
          y: this.heroY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          size: 7,
          color: '#38bdf8',
          alpha: 1.0,
          life: 0.4,
          maxLife: 0.4,
          shape: 'spark',
        });
      }
    } else if (role === 'ranger') {
      // Celestial Piercing Hyper-Arrow (Phá Giáp Đại Tiễn)
      const speed = 820;
      this.projectiles.push({
        id: `p_hyper_arrow_${Date.now()}`,
        x: this.heroX + Math.cos(this.heroFacing) * 30,
        y: this.heroY + Math.sin(this.heroFacing) * 30,
        vx: Math.cos(this.heroFacing) * speed,
        vy: Math.sin(this.heroFacing) * speed,
        radius: 18,
        damage: this.heroStats.atk * 2.8,
        isEnemy: false,
        color: '#84cc16',
        life: 1.5,
        maxLife: 1.5,
        pierce: 8,
        type: 'arrow',
      });

      // Muzzle flash particles
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: this.heroX,
          y: this.heroY,
          vx: Math.cos(this.heroFacing) * 300 + (Math.random() - 0.5) * 100,
          vy: Math.sin(this.heroFacing) * 300 + (Math.random() - 0.5) * 100,
          size: 8,
          color: '#bef264',
          alpha: 1.0,
          life: 0.35,
          maxLife: 0.35,
          shape: 'spark',
        });
      }
    } else if (role === 'assassin') {
      // Shadow Clone Blitz (Phân Thân Ám Sát): 3 shadow strikes with high crit
      sounds.playSlash(1.6);
      this.performAreaAttack(this.heroX, this.heroY, 170, 2.4);

      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        this.particles.push({
          x: this.heroX + Math.cos(a) * 90,
          y: this.heroY + Math.sin(a) * 90,
          vx: Math.cos(a) * 220,
          vy: Math.sin(a) * 220,
          size: 10,
          color: '#10b981',
          alpha: 1.0,
          life: 0.35,
          maxLife: 0.35,
          shape: 'spark',
        });
      }
    } else if (role === 'paladin') {
      // Flying Judgment Hammer (Búa Thần Sấm Sét): Spinning hammer projectile
      const speed = 480;
      this.projectiles.push({
        id: `p_hammer_${Date.now()}`,
        x: this.heroX + Math.cos(this.heroFacing) * 30,
        y: this.heroY + Math.sin(this.heroFacing) * 30,
        vx: Math.cos(this.heroFacing) * speed,
        vy: Math.sin(this.heroFacing) * speed,
        radius: 20,
        damage: this.heroStats.atk * 2.3,
        isEnemy: false,
        color: '#facc15',
        life: 1.2,
        maxLife: 1.2,
        pierce: 5,
        type: 'fireball',
      });

      this.performAreaAttack(this.heroX, this.heroY, 140, 1.4);
    } else {
      // Warrior: Seismic Volcanic Fissure Ground Slam (Thiên Hỏa Liệt Trảm)
      const blastRadius = 220;
      this.performAreaAttack(this.heroX, this.heroY, blastRadius, 2.5);

      // Shockwave fire burst
      const hue = this.heroClass.visuals.slashColor;
      for (let i = 0; i < 36; i++) {
        const angle = (i / 36) * Math.PI * 2;
        const speed = 280 + Math.random() * 140;
        this.particles.push({
          x: this.heroX,
          y: this.heroY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 14,
          color: hue,
          alpha: 1.0,
          life: 0.45,
          maxLife: 0.45,
          shape: 'fire',
        });
      }
    }
  }

  // Ultimate: Cataclysm / Ragnarok / Omnislash / Starfall / Angel Judgment
  public triggerUltimate() {
    if (this.cdUltimate > 0 || this.heroStats.fury < 100) return;
    this.heroStats.fury = 0;
    this.cdUltimate = this.heroClass.skills.ultimate.cooldown || 14.0;
    this.callbacks.onHeroStatsChange(this.heroStats);
    this.callbacks.onSkillUsed?.('ultimate');
    sounds.playUltimate();
    this.screenShake = 26;

    const ultimateRadius = 450;
    this.performAreaAttack(this.heroX, this.heroY, ultimateRadius, 3.8);

    // Role specific ultimate bonuses
    if (this.heroClass.id === 'paladin') {
      // Angel heal
      const heal = Math.round(this.heroStats.maxHp * 0.25);
      this.heroStats.hp = Math.min(this.heroStats.maxHp, this.heroStats.hp + heal);
      this.callbacks.onHeroStatsChange(this.heroStats);
    } else if (this.heroClass.id === 'warrior') {
      this.invulnerableTimer = 1.5;
    }

    // Massive particle explosion
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * ultimateRadius;
      this.particles.push({
        x: this.heroX + Math.cos(angle) * dist,
        y: this.heroY + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 220,
        vy: -140 - Math.random() * 240,
        size: 20,
        color: this.heroClass.visuals.weaponGlow,
        alpha: 1.0,
        life: 0.75,
        maxLife: 0.75,
        shape: 'spark',
      });
    }
  }

  // Ambient Weather Particles
  private spawnWeatherParticle() {
    const weather = this.mapConfig.weather;
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;
    const rx = this.cameraX + (Math.random() - 0.5) * (viewW + 200);
    const ry = this.cameraY + (Math.random() - 0.5) * (viewH + 200);

    if (weather === 'bubbles') {
      this.particles.push({
        x: rx,
        y: this.cameraY + viewH / 2 + 80,
        vx: (Math.random() - 0.5) * 25,
        vy: -50 - Math.random() * 50,
        size: 3 + Math.random() * 6,
        color: 'rgba(56, 189, 248, 0.45)',
        alpha: 0.85,
        life: 2.5,
        maxLife: 2.5,
        shape: 'spark',
      });
    } else if (weather === 'leaves') {
      this.particles.push({
        x: rx,
        y: this.cameraY - viewH / 2 - 40,
        vx: 35 + Math.random() * 35,
        vy: 45 + Math.random() * 35,
        size: 4 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#16a34a' : '#84cc16',
        alpha: 0.8,
        life: 2.8,
        maxLife: 2.8,
        shape: 'spark',
      });
    } else if (weather === 'sand') {
      this.particles.push({
        x: this.cameraX - viewW / 2 - 50,
        y: ry,
        vx: 140 + Math.random() * 90,
        vy: 15 + (Math.random() - 0.5) * 30,
        size: 2 + Math.random() * 3,
        color: '#facc15',
        alpha: 0.65,
        life: 2.0,
        maxLife: 2.0,
        shape: 'spark',
      });
    } else if (weather === 'cave_drip') {
      this.particles.push({
        x: rx,
        y: this.cameraY - viewH / 2 - 20,
        vx: (Math.random() - 0.5) * 10,
        vy: 150 + Math.random() * 60,
        size: 2.5,
        color: '#c084fc',
        alpha: 0.75,
        life: 1.5,
        maxLife: 1.5,
        shape: 'spark',
      });
    } else if (weather === 'embers') {
      this.particles.push({
        x: rx,
        y: this.cameraY + viewH / 2 + 50,
        vx: (Math.random() - 0.5) * 40,
        vy: -70 - Math.random() * 70,
        size: 3 + Math.random() * 4,
        color: '#f97316',
        alpha: 0.9,
        life: 1.8,
        maxLife: 1.8,
        shape: 'fire',
      });
    }
  }

  private performPlayerMeleeAttack(facing: number, range: number, arc: number, dmgMult: number) {
    for (const m of this.monsters) {
      if (m.state === 'dead') continue;
      const dx = m.x - this.heroX;
      const dy = m.y - this.heroY;
      const dist = Math.hypot(dx, dy);

      if (dist <= range + m.radius) {
        const angleToTarget = Math.atan2(dy, dx);
        let angleDiff = Math.abs(angleToTarget - facing);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (angleDiff <= arc / 2) {
          this.hitMonster(m, dmgMult);
        }
      }
    }
  }

  private performAreaAttack(centerX: number, centerY: number, radius: number, dmgMult: number) {
    for (const m of this.monsters) {
      if (m.state === 'dead') continue;
      const dist = Math.hypot(m.x - centerX, m.y - centerY);
      if (dist <= radius + m.radius) {
        this.hitMonster(m, dmgMult);
      }
    }
  }

  private hitMonster(m: Monster, dmgMult: number) {
    const isCrit = Math.random() < this.heroStats.critRate;
    const comboMult = getComboMultiplier(this.combo.rank);
    const effectiveAtk = this.heroStats.atk * dmgMult;
    const { damage } = calculateDamage(effectiveAtk, m.def, isCrit, this.heroStats.critDamage, comboMult);

    m.hp -= damage;
    m.state = 'hurt';
    m.stateTimer = 0.2;

    // Knockback
    const knockAngle = Math.atan2(m.y - this.heroY, m.x - this.heroX);
    const knockForce = m.isBoss ? 40 : 180;
    m.vx += Math.cos(knockAngle) * knockForce;
    m.vy += Math.sin(knockAngle) * knockForce;

    // Lifesteal
    if (this.heroStats.lifesteal > 0) {
      const heal = Math.round(damage * this.heroStats.lifesteal);
      if (heal > 0) {
        this.heroStats.hp = Math.min(this.heroStats.maxHp, this.heroStats.hp + heal);
        this.callbacks.onHeroStatsChange(this.heroStats);
        const lifestealVis = getDamageVisualInfo(heal, false, 'D', false, true);
        this.damageNumbers.push({
          id: `ls_${Date.now()}_${Math.random()}`,
          x: this.heroX + (Math.random() - 0.5) * 16,
          y: this.heroY - 28,
          vx: lifestealVis.vx,
          vy: lifestealVis.vy,
          text: lifestealVis.text,
          isCrit: false,
          isPlayer: false,
          life: lifestealVis.duration,
          maxLife: lifestealVis.duration,
          color: lifestealVis.textColor,
          strokeColor: lifestealVis.strokeColor,
          glowColor: lifestealVis.glowColor,
          fontSize: lifestealVis.fontSize,
          scaleStart: lifestealVis.scaleStart,
          type: 'heal',
        });
      }
    }

    // Gain Fury (Rage)
    this.heroStats.fury = Math.min(this.heroStats.maxFury, this.heroStats.fury + (isCrit ? 9 : 5));
    this.callbacks.onHeroStatsChange(this.heroStats);

    // Combo progress
    this.combo.hits += 1;
    this.combo.timer = this.combo.maxTimer;
    this.combo.rank = getComboRank(this.combo.hits);
    this.combo.multiplier = getComboMultiplier(this.combo.rank);
    this.combo.totalDamage += damage;
    if (this.combo.hits > this.combo.maxHits) {
      this.combo.maxHits = this.combo.hits;
    }
    if (this.combo.hits > this.maxComboEver) {
      this.maxComboEver = this.combo.hits;
    }
    this.callbacks.onComboChange({ ...this.combo });

    // Juice
    sounds.playHit(isCrit);
    this.hitstopTimer = isCrit ? 0.06 : 0.03;
    this.screenShake = isCrit ? 8 : 4;

    // Floating Damage Number with Pop Physics & Distinct Crit Visuals
    const visual = getDamageVisualInfo(damage, isCrit, this.combo.rank, false, false);
    this.damageNumbers.push({
      id: `dmg_${Date.now()}_${Math.random()}`,
      x: m.x + (Math.random() - 0.5) * 24,
      y: m.y - m.radius - 12,
      vx: visual.vx,
      vy: visual.vy,
      text: visual.text,
      isCrit: visual.isCrit,
      isPlayer: false,
      life: visual.duration,
      maxLife: visual.duration,
      color: visual.textColor,
      strokeColor: visual.strokeColor,
      glowColor: visual.glowColor,
      fontSize: visual.fontSize,
      badge: visual.badge,
      scaleStart: visual.scaleStart,
      type: visual.isCrit ? 'crit' : 'normal',
    });

    // Blood / Spark particles
    const pCount = isCrit ? 14 : 7;
    for (let i = 0; i < pCount; i++) {
      const pAngle = knockAngle + (Math.random() - 0.5) * 1.2;
      const speed = 120 + Math.random() * 160;
      this.particles.push({
        x: m.x,
        y: m.y,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        size: 5 + Math.random() * 4,
        color: isCrit ? '#fbbf24' : '#ef4444',
        alpha: 1.0,
        life: 0.35,
        maxLife: 0.35,
        shape: 'spark',
      });
    }

    if (m.isBoss) {
      this.callbacks.onBossHpChange({ ...m });
      if (m.hp <= m.maxHp * 0.5 && m.bossPhase === 1) {
        m.bossPhase = 2;
        m.speed *= 1.35;
        m.color = '#dc2626';
        sounds.playBossRoar();
        this.screenShake = 16;
      }
    }

    // Death check
    if (m.hp <= 0) {
      m.state = 'dead';
      this.totalKills += 1;
      this.giveKillRewards(m);
      this.checkStageCompletion();
    }
  }

  private giveKillRewards(m: Monster) {
    this.heroExp += m.xpValue;
    this.callbacks.onLevelExpChange(this.heroLevel, this.heroExp, 100, m.goldValue);
    this.callbacks.onMonsterKilled?.(m.isBoss);

    // Death burst particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.particles.push({
        x: m.x,
        y: m.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 8 + Math.random() * 6,
        color: m.accentColor,
        alpha: 1.0,
        life: 0.5,
        maxLife: 0.5,
      });
    }
  }

  private checkStageCompletion() {
    const aliveMonsters = this.monsters.filter((m) => m.state !== 'dead');
    if (aliveMonsters.length === 0 && !this.chest) {
      const isBoss = this.mapConfig.stages[this.stageIndex].isBossStage || false;
      const loot = rollChestLoot(this.stageIndex + 1, 0, isBoss);

      this.chest = {
        id: `chest_${Date.now()}`,
        x: this.heroX + 80,
        y: this.heroY,
        radius: 30,
        opened: false,
        tier: loot.tier,
        items: loot.items,
        gold: loot.gold,
        glowAngle: 0,
      };

      sounds.playChestOpen();
      this.callbacks.onStageClear(this.chest);
    }
  }

  public openChest() {
    if (!this.chest || this.chest.opened) return;
    this.chest.opened = true;
    sounds.playChestOpen();

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const speed = 80 + Math.random() * 150;
      this.particles.push({
        x: this.chest.x,
        y: this.chest.y - 10,
        vx: Math.cos(angle) * speed,
        vy: -150 - Math.random() * 100,
        size: 8 + Math.random() * 6,
        color: '#facc15',
        alpha: 1.0,
        life: 0.75,
        maxLife: 0.75,
        shape: 'spark',
      });
    }

    this.callbacks.onChestInteract(this.chest);
  }

  // Game loop
  private loop = (time: number) => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const rawDt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    const dt = Math.min(rawDt, 0.05);

    this.animationTick += dt;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();
  };

  private update(dt: number) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Cooldown ticks
    if (this.cdDash > 0) this.cdDash = Math.max(0, this.cdDash - dt);
    if (this.cdWhirlwind > 0) this.cdWhirlwind = Math.max(0, this.cdWhirlwind - dt);
    if (this.cdInferno > 0) this.cdInferno = Math.max(0, this.cdInferno - dt);
    if (this.cdUltimate > 0) this.cdUltimate = Math.max(0, this.cdUltimate - dt);
    this.callbacks.onSkillCooldownsChange({
      dash: this.cdDash,
      whirlwind: this.cdWhirlwind,
      inferno: this.cdInferno,
      ultimate: this.cdUltimate,
    });

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    if (this.combo.timer > 0) {
      this.combo.timer -= dt;
      if (this.combo.timer <= 0) {
        this.combo.hits = 0;
        this.combo.rank = 'D';
        this.combo.multiplier = 1.0;
        this.combo.totalDamage = 0;
        this.callbacks.onComboChange({ ...this.combo });
      }
    }

    // Ambient weather particles generator
    if (this.particles.length < 80 && Math.random() < 0.45) {
      this.spawnWeatherParticle();
    }

    this.updateHero(dt);

    if (this.isWhirlwinding) {
      this.whirlwindTimer -= dt;
      this.performPlayerMeleeAttack(this.heroFacing, 110, Math.PI * 2, 0.4);
      if (this.whirlwindTimer <= 0) {
        this.isWhirlwinding = false;
      }
    }

    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackHitboxActive = false;
      }
    }

    this.updateMonsters(dt);
    this.updateProjectiles(dt);

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating damage numbers with physics arc & deceleration
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= Math.pow(0.85, dt * 60);
      d.vy += (d.isCrit ? 65 : 45) * dt;
      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    if (this.chest) {
      this.chest.glowAngle += dt * 2;
    }

    this.cameraX += (this.heroX - this.cameraX) * 0.12;
    this.cameraY += (this.heroY - this.cameraY) * 0.12;
  }

  private updateHero(dt: number) {
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.heroX += this.dashVx * dt;
      this.heroY += this.dashVy * dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      let moveX = this.virtualJoystickX;
      let moveY = this.virtualJoystickY;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveY -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveY += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;

      const len = Math.hypot(moveX, moveY);
      if (len > 1) {
        moveX /= len;
        moveY /= len;
      }

      const speed = this.heroStats.speed;
      this.heroX += moveX * speed * dt;
      this.heroY += moveY * speed * dt;

      if (Math.hypot(this.virtualJoystickX, this.virtualJoystickY) > 0.08) {
        this.heroFacing = Math.atan2(this.virtualJoystickY, this.virtualJoystickX);
      } else if (this.hasRecentMouseMove) {
        const worldMouseX = this.mouseX - this.canvas.width / 2 + this.cameraX;
        const worldMouseY = this.mouseY - this.canvas.height / 2 + this.cameraY;
        this.heroFacing = Math.atan2(worldMouseY - this.heroY, worldMouseX - this.heroX);
      }
    }

    const margin = 50;
    this.heroX = Math.max(margin, Math.min(this.arenaWidth - margin, this.heroX));
    this.heroY = Math.max(margin, Math.min(this.arenaHeight - margin, this.heroY));
  }

  private updateMonsters(dt: number) {
    for (const m of this.monsters) {
      if (m.state === 'dead') continue;

      m.vx *= 0.88;
      m.vy *= 0.88;
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (m.state === 'hurt') {
        m.stateTimer -= dt;
        if (m.stateTimer <= 0) {
          m.state = 'chase';
        }
        continue;
      }

      const dx = this.heroX - m.x;
      const dy = this.heroY - m.y;
      const dist = Math.hypot(dx, dy);
      m.facing = Math.atan2(dy, dx);

      if (m.attackCooldown > 0) {
        m.attackCooldown -= dt;
      }

      if (m.archetype === 'ranged') {
        if (dist < 200) {
          m.x -= Math.cos(m.facing) * m.speed * dt;
          m.y -= Math.sin(m.facing) * m.speed * dt;
        } else if (dist > 340) {
          m.x += Math.cos(m.facing) * m.speed * dt;
          m.y += Math.sin(m.facing) * m.speed * dt;
        }

        if (dist <= m.attackRange && m.attackCooldown <= 0) {
          m.state = 'windup';
          m.attackTelegraphTimer += dt;
          if (m.attackTelegraphTimer >= m.attackTelegraphMax) {
            this.shootEnemyProjectile(m.x, m.y, m.facing, m.atk);
            m.attackCooldown = 2.2 + Math.random() * 0.5;
            m.attackTelegraphTimer = 0;
            m.state = 'chase';
          }
        }
      } else if (m.isBoss) {
        m.bossSkillsTimer = (m.bossSkillsTimer || 0) + dt;

        if (dist > m.attackRange) {
          m.x += Math.cos(m.facing) * m.speed * dt;
          m.y += Math.sin(m.facing) * m.speed * dt;
        }

        if (m.bossSkillsTimer > 3.5) {
          m.state = 'windup';
          m.attackTelegraphTimer += dt;
          if (m.attackTelegraphTimer >= m.attackTelegraphMax) {
            sounds.playExplosion();
            this.screenShake = 14;
            const stompRadius = 150;
            if (Math.hypot(this.heroX - m.x, this.heroY - m.y) < stompRadius) {
              this.hurtHero(m.atk * 1.3);
            }
            if (m.bossPhase === 2) {
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                this.shootEnemyProjectile(m.x, m.y, angle, m.atk * 0.7);
              }
            }
            m.bossSkillsTimer = 0;
            m.attackTelegraphTimer = 0;
            m.state = 'chase';
          }
        } else if (dist <= m.attackRange && m.attackCooldown <= 0) {
          this.hurtHero(m.atk);
          m.attackCooldown = 1.6;
        }
      } else {
        if (dist > m.radius + 15) {
          m.x += Math.cos(m.facing) * m.speed * dt;
          m.y += Math.sin(m.facing) * m.speed * dt;
        }

        if (m.archetype === 'brute' && dist < 65) {
          m.state = 'windup';
          m.attackTelegraphTimer += dt;
          if (m.attackTelegraphTimer >= m.attackTelegraphMax) {
            if (dist < 75) {
              this.hurtHero(m.atk);
            }
            m.attackCooldown = 2.0;
            m.attackTelegraphTimer = 0;
            m.state = 'chase';
          }
        } else if (dist <= m.radius + 20 && m.attackCooldown <= 0) {
          this.hurtHero(m.atk);
          m.attackCooldown = 1.2;
        }
      }

      m.x = Math.max(40, Math.min(this.arenaWidth - 40, m.x));
      m.y = Math.max(40, Math.min(this.arenaHeight - 40, m.y));
    }
  }

  private shootEnemyProjectile(x: number, y: number, angle: number, damage: number) {
    const speed = 280;
    this.projectiles.push({
      id: `p_${Date.now()}_${Math.random()}`,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 8,
      damage,
      isEnemy: true,
      color: '#ef4444',
      life: 2.2,
      maxLife: 2.2,
      type: 'arrow',
    });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Projectile particle trails
      if (Math.random() > 0.4) {
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          size: p.radius * 0.7,
          color: p.color,
          alpha: 0.7,
          life: 0.2,
          maxLife: 0.2,
          shape: 'spark',
        });
      }

      if (p.isEnemy) {
        // Collide with hero
        const dist = Math.hypot(p.x - this.heroX, p.y - this.heroY);
        if (dist < p.radius + 20) {
          this.hurtHero(p.damage);
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Player projectile hitting monsters!
        let hitAny = false;
        for (const m of this.monsters) {
          if (m.state === 'dead') continue;
          const dist = Math.hypot(p.x - m.x, p.y - m.y);
          if (dist < p.radius + m.radius) {
            this.hitMonster(m, 1.0);
            hitAny = true;

            // Fireball explosion splash damage
            if (p.type === 'fireball') {
              sounds.playExplosion();
              this.performAreaAttack(p.x, p.y, 80, 0.6);
              for (let k = 0; k < 12; k++) {
                const angle = (k / 12) * Math.PI * 2;
                this.particles.push({
                  x: p.x,
                  y: p.y,
                  vx: Math.cos(angle) * 120,
                  vy: Math.sin(angle) * 120,
                  size: 8,
                  color: '#38bdf8',
                  alpha: 1.0,
                  life: 0.3,
                  maxLife: 0.3,
                  shape: 'spark',
                });
              }
            }

            if (p.pierce && p.pierce > 1) {
              p.pierce -= 1;
            } else {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
        if (hitAny && (!p.pierce || p.pierce <= 1)) {
          continue;
        }
      }

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  public hurtHero(incomingAtk: number) {
    if (this.invulnerableTimer > 0) return;

    const mitigation = 100 / (100 + this.heroStats.def);
    const damage = Math.max(1, Math.round(incomingAtk * mitigation));

    this.heroStats.hp -= damage;
    this.invulnerableTimer = 0.35;
    this.screenShake = 10;
    sounds.playPlayerHurt();

    this.callbacks.onHeroStatsChange({ ...this.heroStats });

    const hurtVisual = getDamageVisualInfo(damage, false, 'D', true, false);
    this.damageNumbers.push({
      id: `hurt_${Date.now()}_${Math.random()}`,
      x: this.heroX + (Math.random() - 0.5) * 16,
      y: this.heroY - 30,
      vx: hurtVisual.vx,
      vy: hurtVisual.vy,
      text: hurtVisual.text,
      isCrit: false,
      isPlayer: true,
      life: hurtVisual.duration,
      maxLife: hurtVisual.duration,
      color: hurtVisual.textColor,
      strokeColor: hurtVisual.strokeColor,
      glowColor: hurtVisual.glowColor,
      fontSize: hurtVisual.fontSize,
      scaleStart: hurtVisual.scaleStart,
      type: 'hero_hurt',
    });

    if (this.heroStats.hp <= 0) {
      this.heroStats.hp = 0;
      this.stop();
      this.callbacks.onGameOver({
        stageNumber: this.stageIndex + 1,
        maxCombo: this.maxComboEver,
        totalKills: this.totalKills,
      });
    }
  }

  // Canvas rendering
  private render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.fillStyle = this.mapConfig.colors.floor;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const shakeX = (Math.random() - 0.5) * this.screenShake;
    const shakeY = (Math.random() - 0.5) * this.screenShake;
    ctx.translate(width / 2 - this.cameraX + shakeX, height / 2 - this.cameraY + shakeY);

    this.drawArenaEnvironment(ctx);

    if (this.chest) {
      this.drawChest(ctx, this.chest);
    }

    for (const m of this.monsters) {
      if (m.state === 'dead') continue;
      this.drawMonster(ctx, m);
    }

    this.drawHero(ctx);
    this.drawProjectiles(ctx);

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating Damage numbers popping over monsters with distinct critical colors and sizes
    for (const d of this.damageNumbers) {
      const age = d.maxLife - d.life;
      const progress = Math.min(1, Math.max(0, age / d.maxLife)); // 0 (spawn) to 1 (despawn)

      // Smooth fade-out near end of lifetime
      let alpha = 1.0;
      if (progress > 0.6) {
        alpha = 1.0 - (progress - 0.6) / 0.4;
      }

      // Elastic pop animation: snaps up on spawn and gently floats
      let scale = 1.0;
      const scaleStart = d.scaleStart || (d.isCrit ? 1.8 : 1.25);
      if (progress < 0.18) {
        const t = progress / 0.18;
        scale = 1.0 + (scaleStart - 1.0) * (1 - Math.sin(t * (Math.PI / 2)));
      } else {
        scale = Math.max(0.85, 1.0 - (progress - 0.18) * 0.12);
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.translate(d.x, d.y);
      ctx.scale(scale, scale);

      if (d.isCrit) {
        // High-impact Critical Hit feedback
        ctx.shadowColor = d.glowColor || '#f59e0b';
        ctx.shadowBlur = 12;

        // Critical banner pill above the number
        if (d.badge) {
          ctx.font = '900 11px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#000000';
          ctx.strokeText(d.badge, 0, -18);
          ctx.fillStyle = '#fef08a';
          ctx.fillText(d.badge, 0, -18);
        }

        const fontSize = d.fontSize || 30;
        ctx.font = `900 ${fontSize}px "Cinzel", "Plus Jakarta Sans", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 5;
        ctx.strokeStyle = d.strokeColor || '#09090b';
        ctx.strokeText(d.text, 0, 0);

        // Blazing molten-gold gradient for critical hits
        const grad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
        grad.addColorStop(0, '#fef9c3');
        grad.addColorStop(0.35, '#facc15');
        grad.addColorStop(0.7, '#f97316');
        grad.addColorStop(1, '#ef4444');
        ctx.fillStyle = grad;
        ctx.fillText(d.text, 0, 0);
      } else if (d.type === 'heal') {
        // Floating Heal Number in Emerald Green
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 8;
        const fontSize = d.fontSize || 19;
        ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = d.strokeColor || '#052e16';
        ctx.strokeText(d.text, 0, 0);
        ctx.fillStyle = d.color || '#4ade80';
        ctx.fillText(d.text, 0, 0);
      } else if (d.isPlayer) {
        // Player damage taken in Deep Crimson
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        const fontSize = d.fontSize || 21;
        ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = d.strokeColor || '#450a0a';
        ctx.strokeText(d.text, 0, 0);
        ctx.fillStyle = d.color || '#f87171';
        ctx.fillText(d.text, 0, 0);
      } else {
        // Normal monster damage: crisp white text with strong dark outline
        ctx.shadowColor = '#0f172a';
        ctx.shadowBlur = 4;
        const fontSize = d.fontSize || 19;
        ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = d.strokeColor || '#0f172a';
        ctx.strokeText(d.text, 0, 0);
        ctx.fillStyle = d.color || '#ffffff';
        ctx.fillText(d.text, 0, 0);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private drawArenaEnvironment(ctx: CanvasRenderingContext2D) {
    const w = this.arenaWidth;
    const h = this.arenaHeight;
    const theme = this.mapConfig.theme;

    // Floor base
    ctx.fillStyle = this.mapConfig.colors.floor;
    ctx.fillRect(0, 0, w, h);

    // Floor tile grid
    ctx.strokeStyle = this.mapConfig.colors.floorGrid;
    ctx.lineWidth = 1;
    const tileSize = 64;
    for (let x = 0; x <= w; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Theme Specific Floor Accents
    if (theme === 'underwater') {
      // Abyssal Caustic light waves
      ctx.save();
      const waveOffset = Math.sin(this.animationTick * 2) * 20;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 4;
      for (let y = 100; y < h; y += 140) {
        ctx.beginPath();
        ctx.moveTo(0, y + waveOffset);
        ctx.bezierCurveTo(w * 0.3, y - waveOffset, w * 0.7, y + waveOffset, w, y - waveOffset);
        ctx.stroke();
      }
      ctx.restore();
    } else if (theme === 'desert') {
      // Sand ripple patterns
      ctx.save();
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.08)';
      ctx.lineWidth = 3;
      for (let y = 80; y < h; y += 120) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(w * 0.5, y + 25, w, y);
        ctx.stroke();
      }
      ctx.restore();
    } else if (theme === 'cave') {
      // Glowing amethyst crystal clusters at corners
      const corners = [
        [120, 120],
        [w - 120, 120],
        [120, h - 120],
        [w - 120, h - 120],
      ];
      ctx.save();
      for (const [cx, cy] of corners) {
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 24);
        ctx.lineTo(cx + 14, cy + 12);
        ctx.lineTo(cx - 14, cy + 12);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 12, cy - 14);
        ctx.lineTo(cx + 24, cy + 16);
        ctx.lineTo(cx, cy + 16);
        ctx.fill();
      }
      ctx.restore();
    }

    // Outer Boundary Wall
    ctx.strokeStyle = this.mapConfig.colors.wall;
    ctx.lineWidth = 14;
    ctx.strokeRect(0, 0, w, h);

    // Inner Central Circle
    ctx.strokeStyle = this.mapConfig.colors.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 450, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawChest(ctx: CanvasRenderingContext2D, chest: ChestEntity) {
    ctx.save();
    const gradient = ctx.createLinearGradient(chest.x, chest.y - 300, chest.x, chest.y);
    gradient.addColorStop(0, 'rgba(250, 204, 21, 0)');
    gradient.addColorStop(1, 'rgba(250, 204, 21, 0.45)');
    ctx.fillStyle = gradient;
    ctx.fillRect(chest.x - 30, chest.y - 300, 60, 300);

    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(chest.x - 24, chest.y - 18, 48, 36, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(chest.x, chest.y, 6, 0, Math.PI * 2);
    ctx.fill();

    if (!chest.opened) {
      ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('[SPACE / E] Mở Hòm Báu', chest.x, chest.y - 32);
    }
    ctx.restore();
  }

  // Eye-Catching Monster Rendering
  private drawMonster(ctx: CanvasRenderingContext2D, m: Monster) {
    ctx.save();

    // Red warning circle if winding up attack
    if (m.state === 'windup') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius + 22, 0, Math.PI * 2);
      ctx.stroke();

      // Flashing exclamation mark
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', m.x, m.y - m.radius - 16);
    }

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(m.x, m.y + m.radius * 0.75, m.radius * 1.1, m.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.facing);

    if (m.isBoss) {
      this.drawBoss(ctx, m);
    } else if (m.archetype === 'swarm') {
      // ===== PREDATORY SHADOW WOLF =====
      // Ears
      ctx.fillStyle = '#4c0519';
      ctx.beginPath();
      ctx.moveTo(-5, -m.radius);
      ctx.lineTo(12, -m.radius - 12);
      ctx.lineTo(5, -m.radius + 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-5, m.radius);
      ctx.lineTo(12, m.radius + 12);
      ctx.lineTo(5, m.radius - 5);
      ctx.fill();

      // Bushy Wolf Tail
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.moveTo(-m.radius, 0);
      ctx.quadraticCurveTo(-m.radius - 18, Math.sin(this.animationTick * 8) * 8, -m.radius - 22, 0);
      ctx.lineTo(-m.radius + 2, 4);
      ctx.fill();

      // Body
      ctx.fillStyle = m.color;
      ctx.strokeStyle = m.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, m.radius * 1.1, m.radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fangs & Snout
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(m.radius * 0.8, -4);
      ctx.lineTo(m.radius * 1.15, 0);
      ctx.lineTo(m.radius * 0.8, 4);
      ctx.fill();

      // Red Glowing Eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(m.radius * 0.4, -6, 3, 0, Math.PI * 2);
      ctx.arc(m.radius * 0.4, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.archetype === 'ranged') {
      // ===== ARCHER WRAITH / SKELETON =====
      // Tattered Hood
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Skull / Spirit Face
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(m.radius * 0.35, 0, m.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Bone Bow in hand
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(m.radius * 0.8, 0, 18, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      // Aiming laser sightline
      if (m.state === 'windup') {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(m.radius, 0);
        ctx.lineTo(360, 0);
        ctx.stroke();
      }
    } else if (m.archetype === 'brute') {
      // ===== HEAVY IRON BRUTE =====
      // Massive Spiked Pauldrons
      ctx.fillStyle = '#292524';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -m.radius * 0.9, 14, 0, Math.PI * 2);
      ctx.arc(0, m.radius * 0.9, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spiked Mace in hand
      ctx.fillStyle = '#78350f';
      ctx.fillRect(10, 12, 28, 8);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(38, 16, 12, 0, Math.PI * 2);
      ctx.fill();

      // Muscular Armored Body
      ctx.fillStyle = m.color;
      ctx.strokeStyle = m.accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Iron Horned Mask
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(m.radius * 0.4, -8, 4, 0, Math.PI * 2);
      ctx.arc(m.radius * 0.4, 8, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ===== ASSASSIN PHANTOM =====
      ctx.fillStyle = m.color;
      ctx.strokeStyle = m.accentColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Dual Scythe blades
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(12, -14, 16, 0, Math.PI * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 14, 16, -Math.PI * 0.6, 0);
      ctx.stroke();

      // Purple Glowing Eyes
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(m.radius * 0.4, -5, 3, 0, Math.PI * 2);
      ctx.arc(m.radius * 0.4, 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Mini HP bar for regular monsters
    if (!m.isBoss && m.hp < m.maxHp) {
      const barW = m.radius * 2.2;
      const barH = 5;
      const barX = m.x - barW / 2;
      const barY = m.y - m.radius - 12;

      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barY, barW * (m.hp / m.maxHp), barH);
    }

    ctx.restore();
  }

  // Visual Procedural Rendering for Bosses with Multiple Forms
  private drawBoss(ctx: CanvasRenderingContext2D, m: Monster) {
    const form = m.bossForm || 'demon';
    const rad = m.radius;
    const isP2 = m.bossPhase === 2;

    // Glowing Rune Ring Beneath Boss
    ctx.save();
    ctx.rotate(-m.facing + this.animationTick * 0.8);
    ctx.strokeStyle = isP2 ? '#ef4444' : m.accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rad * 0.5, Math.sin(a) * rad * 0.5);
      ctx.lineTo(Math.cos(a) * rad * 1.35, Math.sin(a) * rad * 1.35);
      ctx.stroke();
    }
    ctx.restore();

    if (form === 'dragon') {
      // ===== BOSS RỒNG THẦN (DRAGON) =====
      const wingFlap = Math.sin(this.animationTick * 6) * 12;
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      // Top wing
      ctx.beginPath();
      ctx.moveTo(-10, -20);
      ctx.quadraticCurveTo(-50, -80 + wingFlap, -85, -60 + wingFlap);
      ctx.quadraticCurveTo(-60, -30, -10, -10);
      ctx.fill();
      ctx.stroke();
      // Bottom wing
      ctx.beginPath();
      ctx.moveTo(-10, 20);
      ctx.quadraticCurveTo(-50, 80 - wingFlap, -85, 60 - wingFlap);
      ctx.quadraticCurveTo(-60, 30, -10, 10);
      ctx.fill();
      ctx.stroke();

      // Dragon tail
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.moveTo(-rad, 0);
      ctx.quadraticCurveTo(-rad - 25, Math.sin(this.animationTick * 4) * 15, -rad - 45, 0);
      ctx.lineTo(-rad, 6);
      ctx.fill();

      // Dragon body
      ctx.fillStyle = isP2 ? '#047857' : '#065f46';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, rad * 1.05, rad * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Horns
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(10, -18);
      ctx.quadraticCurveTo(-20, -45, -35, -40);
      ctx.quadraticCurveTo(-15, -25, 5, -12);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, 18);
      ctx.quadraticCurveTo(-20, 45, -35, 40);
      ctx.quadraticCurveTo(-15, 25, 5, 12);
      ctx.fill();

      // Slit Dragon Eyes
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(rad * 0.45, -12, 5, 0, Math.PI * 2);
      ctx.arc(rad * 0.45, 12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(rad * 0.45 - 1, -16, 2, 8);
      ctx.fillRect(rad * 0.45 - 1, 8, 2, 8);
    } else if (form === 'skeleton') {
      // ===== BOSS NGƯỜI XƯƠNG CỔ ĐẠI (SKELETON) =====
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15, -rad * 0.9);
      ctx.lineTo(0, -rad * 1.3);
      ctx.lineTo(15, -rad * 0.9);
      ctx.lineTo(25, -rad * 1.25);
      ctx.lineTo(35, -rad * 0.7);
      ctx.lineTo(-15, -rad * 0.7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(10, -rad * 0.8);
      ctx.lineTo(45, -rad * 1.1);
      ctx.moveTo(10, rad * 0.8);
      ctx.lineTo(45, rad * 1.1);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(rad * 0.35, -12, 7, 0, Math.PI * 2);
      ctx.arc(rad * 0.35, 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (form === 'mummy') {
      // ===== BOSS XÁC ƯỚP PHARAOH (MUMMY) =====
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(0, 0, rad * 1.15, -Math.PI * 0.65, Math.PI * 0.65);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      for (let i = -rad * 0.7; i <= rad * 0.7; i += 12) {
        ctx.beginPath();
        ctx.moveTo(-rad * 0.8, i);
        ctx.lineTo(rad * 0.8, i);
        ctx.stroke();
      }

      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(rad * 0.4, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (form === 'anubis') {
      // ===== BOSS THẦN SA ANUBIS =====
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -rad * 0.8);
      ctx.lineTo(15, -rad * 1.45);
      ctx.lineTo(25, -rad * 0.7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, rad * 0.8);
      ctx.lineTo(15, rad * 1.45);
      ctx.lineTo(25, rad * 0.7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(25, -30);
      ctx.lineTo(60, -30);
      ctx.stroke();

      ctx.fillStyle = '#f0abfc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(rad * 0.45, -10, 6, 0, Math.PI * 2);
      ctx.arc(rad * 0.45, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (form === 'leviathan' || form === 'kraken' || form === 'siren' || form === 'shark') {
      // ===== BOSS THỦY QUÁI & BIỂN SÂU (LEVIATHAN) =====
      for (let i = 0; i < 6; i++) {
        const tentacleAngle = (i / 6) * Math.PI * 2 + Math.sin(this.animationTick * 3 + i) * 0.3;
        const tx = Math.cos(tentacleAngle) * (rad + 26);
        const ty = Math.sin(tentacleAngle) * (rad + 26);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(tentacleAngle) * (rad * 0.8), Math.sin(tentacleAngle) * (rad * 0.8));
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.65, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#67e8f9';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(rad * 0.4, -12, 6, 0, Math.PI * 2);
      ctx.arc(rad * 0.4, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // ===== BOSS DEMON / QUỶ HANG ĐỘNG / OVERLORD (Default) =====
      ctx.fillStyle = '#450a0a';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-15, -15);
      ctx.quadraticCurveTo(-65, -80, -95, -60);
      ctx.quadraticCurveTo(-80, -35, -70, -25);
      ctx.lineTo(-15, -10);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-15, 15);
      ctx.quadraticCurveTo(-65, 80, -95, 60);
      ctx.quadraticCurveTo(-80, 35, -70, 25);
      ctx.lineTo(-15, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = isP2 ? '#f97316' : '#991b1b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, -24);
      ctx.quadraticCurveTo(35, -48, 55, -45);
      ctx.quadraticCurveTo(30, -30, 15, -16);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, 24);
      ctx.quadraticCurveTo(35, 48, 55, 45);
      ctx.quadraticCurveTo(30, 30, 15, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isP2 ? '#7f1d1d' : '#1c1917';
      ctx.strokeStyle = m.accentColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(rad * 0.45, -12, 6, 0, Math.PI * 2);
      ctx.arc(rad * 0.45, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Phase 2 Orbiting Satellite Fireballs
    if (isP2) {
      for (let i = 0; i < 4; i++) {
        const orbAngle = this.animationTick * 3 + (i / 4) * Math.PI * 2;
        const ox = Math.cos(orbAngle) * (rad + 35);
        const oy = Math.sin(orbAngle) * (rad + 35);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(ox, oy, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Eye-Catching Character Rendering by Class
  private drawHero(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const vis = this.heroClass.visuals;

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    // Dynamic Rotating Hero Ground Aura
    ctx.save();
    ctx.translate(this.heroX, this.heroY + 8);
    ctx.rotate(this.animationTick * 1.5);
    ctx.strokeStyle = vis.auraColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.stroke();
    // 4 Cardinal Star Points
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 32, Math.sin(a) * 32, 3, 0, Math.PI * 2);
      ctx.fillStyle = vis.weaponGlow;
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(this.heroX, this.heroY);
    ctx.rotate(this.heroFacing);

    // 1. Flowing Cape / Robe Tail
    ctx.fillStyle = vis.capeColor;
    const waveOffset = Math.sin(this.animationTick * 8) * 4;
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.quadraticCurveTo(-28, waveOffset, -10, 16);
    ctx.fill();

    // 2. Class-Specific Armor & Headgear
    const model = vis.modelType;

    if (model === 'warrior') {
      // Spiked Iron Pauldrons
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-2, -18, 9, 0, Math.PI * 2);
      ctx.arc(-2, 18, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Main Torso Armor
      ctx.fillStyle = vis.primaryColor;
      ctx.strokeStyle = vis.secondaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Horned Battle Helm Visor
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(8, -4, 8, 3);
      ctx.fillRect(8, 2, 8, 3);

      // Flaming Greatsword in Hand
      ctx.save();
      ctx.translate(14, 12);
      if (this.isAttacking) {
        ctx.rotate(Math.sin((0.22 - this.attackTimer) * 20) * 1.6);
      }
      ctx.fillStyle = vis.weaponGlow;
      ctx.strokeStyle = vis.slashColor;
      ctx.lineWidth = 3;
      ctx.fillRect(0, -5, 34, 10);
      ctx.strokeRect(0, -5, 34, 10);
      ctx.restore();
    } else if (model === 'mage') {
      // Arcane Robe
      ctx.fillStyle = vis.primaryColor;
      ctx.strokeStyle = vis.secondaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wizard Hat / Cowl
      ctx.fillStyle = vis.hairColor;
      ctx.beginPath();
      ctx.moveTo(-4, -12);
      ctx.lineTo(12, 0);
      ctx.lineTo(-4, 12);
      ctx.fill();

      // Crystalline Staff in Hand with Orbiting Arcane Sphere
      ctx.save();
      ctx.translate(12, 14);
      if (this.isAttacking) {
        ctx.rotate(Math.sin((0.22 - this.attackTimer) * 20) * 1.2);
      }
      // Staff Shaft
      ctx.strokeStyle = '#e0e7ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(28, 0);
      ctx.stroke();
      // Orbiting Crystal Head
      ctx.fillStyle = vis.secondaryColor;
      ctx.shadowColor = vis.secondaryColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(32, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else if (model === 'assassin') {
      // Sleek Ninja Stealth Suit
      ctx.fillStyle = vis.primaryColor;
      ctx.strokeStyle = vis.secondaryColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing Eyes
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(10, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(10, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Dual Phantom Daggers (one in left hand, one in right hand!)
      ctx.save();
      ctx.translate(10, 12);
      if (this.isAttacking) {
        ctx.rotate(Math.sin((0.22 - this.attackTimer) * 25) * 1.8);
      }
      ctx.fillStyle = vis.weaponGlow;
      ctx.fillRect(0, -3, 22, 5);
      ctx.restore();

      ctx.save();
      ctx.translate(10, -12);
      if (this.isAttacking) {
        ctx.rotate(-Math.sin((0.22 - this.attackTimer) * 25) * 1.8);
      }
      ctx.fillStyle = vis.weaponGlow;
      ctx.fillRect(0, -3, 22, 5);
      ctx.restore();
    } else if (model === 'ranger') {
      // Elven Ranger Hood
      ctx.fillStyle = vis.primaryColor;
      ctx.strokeStyle = vis.secondaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Elven Golden Hair
      ctx.fillStyle = vis.hairColor;
      ctx.beginPath();
      ctx.arc(-4, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Composite Longbow in Hand
      ctx.save();
      ctx.translate(16, 0);
      if (this.isAttacking) {
        ctx.rotate(Math.sin((0.22 - this.attackTimer) * 15) * 0.8);
      }
      ctx.strokeStyle = vis.weaponGlow;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 20, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      // Bowstring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI * 0.45) * 20, Math.sin(-Math.PI * 0.45) * 20);
      ctx.lineTo(-6, 0);
      ctx.lineTo(Math.cos(Math.PI * 0.45) * 20, Math.sin(Math.PI * 0.45) * 20);
      ctx.stroke();
      ctx.restore();
    } else {
      // Paladin Full Plate & Holy Shield
      // Holy Halo above head
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 24, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Heavy Plate Armor
      ctx.fillStyle = vis.primaryColor;
      ctx.strokeStyle = vis.secondaryColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Radiant Shield on off-hand
      ctx.fillStyle = '#ca8a04';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(4, -18);
      ctx.lineTo(16, -18);
      ctx.lineTo(10, -6);
      ctx.fill();
      ctx.stroke();

      // Holy War Hammer
      ctx.save();
      ctx.translate(14, 12);
      if (this.isAttacking) {
        ctx.rotate(Math.sin((0.22 - this.attackTimer) * 20) * 1.5);
      }
      ctx.fillStyle = vis.weaponGlow;
      ctx.fillRect(0, -3, 24, 6);
      ctx.fillRect(18, -12, 12, 24);
      ctx.restore();
    }

    ctx.restore();

    // Slash Arc effect
    if (this.isAttacking && (model === 'warrior' || model === 'assassin' || model === 'paladin')) {
      ctx.save();
      ctx.strokeStyle = vis.slashColor;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(this.heroX, this.heroY, 70, this.heroFacing - 0.8, this.heroFacing + 0.8);
      ctx.stroke();
      ctx.restore();
    }

    // Whirlwind circle
    if (this.isWhirlwinding) {
      ctx.save();
      ctx.strokeStyle = vis.slashColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(this.heroX, this.heroY, 115, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D) {
    for (const p of this.projectiles) {
      ctx.save();
      if (p.type === 'fireball') {
        // Glowing Fireball with inner core
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'arrow') {
        // Piercing Arrow with tip
        const angle = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.lineTo(8, -5);
        ctx.moveTo(16, 0);
        ctx.lineTo(8, 5);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'shuriken') {
        // Spinning Ninja Star
        const angle = this.animationTick * 25;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = p.color;
        for (let j = 0; j < 4; j++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-4, 12);
          ctx.lineTo(4, 12);
          ctx.fill();
        }
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
