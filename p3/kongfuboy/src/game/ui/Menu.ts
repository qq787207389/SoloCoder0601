import type { InputManager } from '../core/Input';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_NAMES } from '../constants';

export type MenuType = 'MAIN' | 'PAUSE' | 'VICTORY' | 'DEFEAT' | 'BOSS_INTRO';

export interface MenuAction {
  action: 'START' | 'RESUME' | 'RESTART' | 'MAIN_MENU' | 'NEXT_LEVEL' | 'CONTROLS' | 'ABOUT' | 'SELECT_UP' | 'SELECT_DOWN' | 'NONE';
  selectedIndex?: number;
}

export interface BattleStats {
  totalDamage: number;
  maxCombo: number;
  enemiesDefeated: number;
  timeElapsed: number;
  perfectBonus: boolean;
  itemsCollected: {
    mantou: number;
    tea: number;
    coin: number;
  };
}

export class Menu {
  private readonly MAIN_MENU_ITEMS = ['开始游戏', '操作说明', '关于'];
  private readonly PAUSE_MENU_ITEMS = ['继续游戏', '重新开始', '返回主菜单'];

  renderMainMenu(ctx: CanvasRenderingContext2D, selectedIndex: number): void {
    ctx.save();

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1A0A0A');
    gradient.addColorStop(0.5, '#2D1515');
    gradient.addColorStop(1, '#1A0A0A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.renderDecorativePattern(ctx);

    const centerX = CANVAS_WIDTH / 2;

    ctx.shadowColor = COLORS.CHINA_RED;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 72px "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.ANCIENT_GOLD;
    ctx.fillText('功夫小子', centerX, CANVAS_HEIGHT * 0.25);
    ctx.shadowBlur = 0;

    ctx.font = '24px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.fillText('KUNGFU BOY', centerX, CANVAS_HEIGHT * 0.25 + 50);

    const startY = CANVAS_HEIGHT * 0.45;
    const spacing = 60;

    this.MAIN_MENU_ITEMS.forEach((item, index) => {
      const y = startY + index * spacing;
      const isSelected = index === selectedIndex;

      if (isSelected) {
        ctx.shadowColor = COLORS.HIGHLIGHT;
        ctx.shadowBlur = 15;
        ctx.fillStyle = COLORS.HIGHLIGHT;
        ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
        ctx.fillText(`▶ ${item} ◀`, centerX, y);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = COLORS.TEXT_PRIMARY;
        ctx.font = '24px "Microsoft YaHei", sans-serif';
        ctx.fillText(item, centerX, y);
      }
    });

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillText('↑↓ 选择 | Enter 确认', centerX, CANVAS_HEIGHT - 60);

    ctx.restore();
  }

  renderPauseMenu(ctx: CanvasRenderingContext2D, selectedIndex: number): void {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;

    ctx.fillStyle = COLORS.ANCIENT_GOLD;
    ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', centerX, CANVAS_HEIGHT * 0.3);

    const startY = CANVAS_HEIGHT * 0.45;
    const spacing = 60;

    this.PAUSE_MENU_ITEMS.forEach((item, index) => {
      const y = startY + index * spacing;
      const isSelected = index === selectedIndex;

      if (isSelected) {
        ctx.shadowColor = COLORS.HIGHLIGHT;
        ctx.shadowBlur = 15;
        ctx.fillStyle = COLORS.HIGHLIGHT;
        ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
        ctx.fillText(`▶ ${item} ◀`, centerX, y);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = COLORS.TEXT_PRIMARY;
        ctx.font = '22px "Microsoft YaHei", sans-serif';
        ctx.fillText(item, centerX, y);
      }
    });

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillText('↑↓ 选择 | Enter 确认 | ESC 继续', centerX, CANVAS_HEIGHT - 60);

    ctx.restore();
  }

  renderVictory(ctx: CanvasRenderingContext2D, stats: BattleStats, levelIndex: number): void {
    ctx.save();

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1A1A0A');
    gradient.addColorStop(0.5, '#2D2D15');
    gradient.addColorStop(1, '#1A1A0A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;

    ctx.shadowColor = COLORS.ANCIENT_GOLD;
    ctx.shadowBlur = 40;
    ctx.fillStyle = COLORS.ANCIENT_GOLD;
    ctx.font = 'bold 64px "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.fillText('胜利!', centerX, CANVAS_HEIGHT * 0.18);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = '28px "Microsoft YaHei", sans-serif';
    ctx.fillText(LEVEL_NAMES[levelIndex] || `第${levelIndex + 1}关 完成`, centerX, CANVAS_HEIGHT * 0.18 + 60);

    const panelX = centerX - 300;
    const panelY = CANVAS_HEIGHT * 0.3;
    const panelWidth = 600;
    const panelHeight = 300;

    ctx.fillStyle = COLORS.UI_BG;
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 3;
    this.drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('战斗统计', panelX + 30, panelY + 45);

    ctx.font = '18px "Microsoft YaHei", sans-serif';
    const statsStartY = panelY + 90;
    const lineHeight = 40;

    const statsData = [
      { label: '总伤害', value: stats.totalDamage.toLocaleString() },
      { label: '最高连击', value: `${stats.maxCombo} 连击` },
      { label: '击败敌人', value: `${stats.enemiesDefeated} 个` },
      { label: '用时', value: this.formatTime(stats.timeElapsed) },
    ];

    statsData.forEach((stat, index) => {
      const y = statsStartY + index * lineHeight;
      ctx.fillStyle = COLORS.TEXT_SECONDARY;
      ctx.fillText(stat.label, panelX + 30, y);
      ctx.fillStyle = COLORS.HIGHLIGHT;
      ctx.textAlign = 'right';
      ctx.fillText(stat.value, panelX + panelWidth - 30, y);
      ctx.textAlign = 'left';
    });

    if (stats.perfectBonus) {
      ctx.fillStyle = COLORS.HIGHLIGHT;
      ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ 无伤通关! +50% 经验加成 ★', centerX, panelY + panelHeight - 30);
    }

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = '20px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('获得道具:', panelX + 30, panelY + panelHeight - 80);

    const itemsX = panelX + 180;
    const itemsY = panelY + panelHeight - 80;

    if (stats.itemsCollected.mantou > 0) {
      ctx.fillStyle = '#8B4513';
      ctx.fillText(`🍞 馒头 x${stats.itemsCollected.mantou}`, itemsX, itemsY);
    }
    if (stats.itemsCollected.tea > 0) {
      ctx.fillStyle = '#228B22';
      ctx.fillText(`🍵 茶 x${stats.itemsCollected.tea}`, itemsX + 120, itemsY);
    }
    if (stats.itemsCollected.coin > 0) {
      ctx.fillStyle = COLORS.ANCIENT_GOLD;
      ctx.fillText(`💰 铜钱 x${stats.itemsCollected.coin}`, itemsX + 220, itemsY);
    }

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    if (levelIndex < LEVEL_NAMES.length - 1) {
      ctx.fillText('Enter 下一关 | R 重新开始 | M 返回主菜单', centerX, CANVAS_HEIGHT - 50);
    } else {
      ctx.fillStyle = COLORS.HIGHLIGHT;
      ctx.fillText('🎉 恭喜通关! Enter 返回主菜单', centerX, CANVAS_HEIGHT - 50);
    }

    ctx.restore();
  }

  renderDefeat(ctx: CanvasRenderingContext2D, stats: BattleStats): void {
    ctx.save();

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0A0A0A');
    gradient.addColorStop(0.5, '#1A0A0A');
    gradient.addColorStop(1, '#0A0A0A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;

    ctx.shadowColor = COLORS.CHINA_RED;
    ctx.shadowBlur = 40;
    ctx.fillStyle = COLORS.CHINA_RED;
    ctx.font = 'bold 64px "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.fillText('战败...', centerX, CANVAS_HEIGHT * 0.25);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = '24px "Microsoft YaHei", sans-serif';
    ctx.fillText('不要气馁，再接再厉!', centerX, CANVAS_HEIGHT * 0.25 + 60);

    const panelX = centerX - 300;
    const panelY = CANVAS_HEIGHT * 0.4;
    const panelWidth = 600;
    const panelHeight = 180;

    ctx.fillStyle = COLORS.UI_BG;
    ctx.strokeStyle = COLORS.CHINA_RED;
    ctx.lineWidth = 3;
    this.drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    const statsStartY = panelY + 50;
    const lineHeight = 35;

    const statsData = [
      { label: '总伤害', value: stats.totalDamage.toLocaleString() },
      { label: '最高连击', value: `${stats.maxCombo} 连击` },
      { label: '击败敌人', value: `${stats.enemiesDefeated} 个` },
    ];

    statsData.forEach((stat, index) => {
      const y = statsStartY + index * lineHeight;
      ctx.fillStyle = COLORS.TEXT_SECONDARY;
      ctx.fillText(stat.label, panelX + 30, y);
      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.textAlign = 'right';
      ctx.fillText(stat.value, panelX + panelWidth - 30, y);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R 重新开始 | M 返回主菜单', centerX, CANVAS_HEIGHT - 50);

    ctx.restore();
  }

  renderBossIntro(
    ctx: CanvasRenderingContext2D,
    bossName: string,
    bossLine: string,
    progress: number
  ): void {
    ctx.save();

    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(progress * 1.5, 0.85)})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    const nameProgress = Math.min(progress * 2, 1);
    const lineProgress = Math.max(0, Math.min((progress - 0.3) * 2, 1));

    if (nameProgress > 0) {
      ctx.save();
      ctx.globalAlpha = nameProgress;

      ctx.shadowColor = COLORS.CHINA_RED;
      ctx.shadowBlur = 30;
      ctx.fillStyle = COLORS.CHINA_RED;
      ctx.font = 'bold 56px "Microsoft YaHei", serif';
      ctx.textAlign = 'center';
      ctx.fillText(bossName, centerX, centerY - 40);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = COLORS.ANCIENT_GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 200, centerY + 10);
      ctx.lineTo(centerX + 200, centerY + 10);
      ctx.stroke();

      ctx.restore();
    }

    if (lineProgress > 0) {
      ctx.save();
      ctx.globalAlpha = lineProgress;

      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = 'italic 24px "Microsoft YaHei", serif';
      ctx.textAlign = 'center';
      ctx.fillText(`"${bossLine}"`, centerX, centerY + 70);

      ctx.restore();
    }

    if (progress > 0.7) {
      const indicatorAlpha = (progress - 0.7) * 3.33;
      ctx.save();
      ctx.globalAlpha = indicatorAlpha * (0.5 + Math.sin(Date.now() / 200) * 0.5);
      ctx.fillStyle = COLORS.TEXT_SECONDARY;
      ctx.font = '18px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('按任意键跳过...', centerX, CANVAS_HEIGHT - 80);
      ctx.restore();
    }

    ctx.restore();
  }

  renderControls(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1A0A0A');
    gradient.addColorStop(0.5, '#2D1515');
    gradient.addColorStop(1, '#1A0A0A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.renderDecorativePattern(ctx);

    const centerX = CANVAS_WIDTH / 2;

    ctx.shadowColor = COLORS.ANCIENT_GOLD;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.ANCIENT_GOLD;
    ctx.font = 'bold 48px "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.fillText('操作说明', centerX, 80);
    ctx.shadowBlur = 0;

    const controls = [
      { key: 'W A S D / 方向键', desc: '移动' },
      { key: '空格 / W / ↑', desc: '跳跃' },
      { key: 'J', desc: '拳攻击 (快, 低伤害)' },
      { key: 'K', desc: '脚攻击 (慢, 高伤害)' },
      { key: 'L', desc: '必杀技 (气力满时可用)' },
      { key: 'Shift', desc: '格挡' },
      { key: '→ + J', desc: '前冲拳' },
      { key: '↑ + J', desc: '上勾拳' },
      { key: '↓ + K', desc: '扫堂腿' },
      { key: '空中 + K', desc: '飞踢' },
      { key: '↓ + L', desc: '气功波' },
      { key: 'Enter', desc: '确认 / 开始' },
      { key: 'Esc', desc: '暂停' },
    ];

    const startY = 140;
    const lineHeight = 36;
    const col1X = centerX - 200;
    const col2X = centerX + 50;

    ctx.font = '18px "Microsoft YaHei", sans-serif';
    controls.forEach((ctrl, index) => {
      const y = startY + index * lineHeight;
      ctx.fillStyle = COLORS.HIGHLIGHT;
      ctx.textAlign = 'right';
      ctx.fillText(ctrl.key, col1X, y);
      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.textAlign = 'left';
      ctx.fillText(' : ' + ctrl.desc, col1X + 10, y);
    });

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('按任意键返回', centerX, CANVAS_HEIGHT - 60);

    ctx.restore();
  }

  renderAbout(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1A0A0A');
    gradient.addColorStop(0.5, '#2D1515');
    gradient.addColorStop(1, '#1A0A0A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.renderDecorativePattern(ctx);

    const centerX = CANVAS_WIDTH / 2;

    ctx.shadowColor = COLORS.ANCIENT_GOLD;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.ANCIENT_GOLD;
    ctx.font = 'bold 48px "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.fillText('关于游戏', centerX, 100);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = '20px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    
    const lines = [
      '《功夫小子》',
      '',
      '一款东方武术题材的横版动作闯关游戏',
      '',
      '你将扮演一名少年武者，赤手空拳踏上挑战各路高手的旅途，',
      '目标是击败最终Boss——你的师兄，为师门正名。',
      '',
      '游戏特色：',
      '• 6个独特关卡，从少林寺塔林到金銮大殿',
      '• 8种武术招式，拳脚组合变幻无穷',
      '• 6位风格各异的Boss，各有独特的武术流派',
      '• 丰富的战斗系统：连击、气力、必杀技',
      '• 精美的像素艺术风格，还原东方武术美学',
      '',
      '战斗技巧：',
      '• 连续命中累积气力，气满释放必杀技',
      '• 抓住敌人硬直窗口出招，避免被反制',
      '• 不同Boss需要不同的战术策略',
    ];

    const startY = 180;
    const lineHeight = 32;
    lines.forEach((line, index) => {
      ctx.fillText(line, centerX, startY + index * lineHeight);
    });

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillText('按任意键返回', centerX, CANVAS_HEIGHT - 60);

    ctx.restore();
  }

  handleMenuInput(input: InputManager, menuType: MenuType, selectedIndex: number): MenuAction {
    if (input.isJustPressed('UP')) {
      const maxIndex = this.getMaxIndex(menuType);
      const newIndex = selectedIndex <= 0 ? maxIndex : selectedIndex - 1;
      return { action: 'SELECT_UP', selectedIndex: newIndex };
    }

    if (input.isJustPressed('DOWN')) {
      const maxIndex = this.getMaxIndex(menuType);
      const newIndex = selectedIndex >= maxIndex ? 0 : selectedIndex + 1;
      return { action: 'SELECT_DOWN', selectedIndex: newIndex };
    }

    if (input.isJustPressed('CONFIRM') || input.isJustPressed('PUNCH')) {
      return this.getConfirmAction(menuType, selectedIndex);
    }

    if (menuType === 'PAUSE' && input.isJustPressed('PAUSE')) {
      return { action: 'RESUME' };
    }

    return { action: 'NONE' };
  }

  private getMaxIndex(menuType: MenuType): number {
    switch (menuType) {
      case 'MAIN':
        return this.MAIN_MENU_ITEMS.length - 1;
      case 'PAUSE':
        return this.PAUSE_MENU_ITEMS.length - 1;
      default:
        return 0;
    }
  }

  private getConfirmAction(menuType: MenuType, selectedIndex: number): MenuAction {
    switch (menuType) {
      case 'MAIN':
        switch (selectedIndex) {
          case 0:
            return { action: 'START', selectedIndex };
          case 1:
            return { action: 'CONTROLS', selectedIndex };
          case 2:
            return { action: 'ABOUT', selectedIndex };
          default:
            return { action: 'NONE', selectedIndex };
        }
      case 'PAUSE':
        switch (selectedIndex) {
          case 0:
            return { action: 'RESUME', selectedIndex };
          case 1:
            return { action: 'RESTART', selectedIndex };
          case 2:
            return { action: 'MAIN_MENU', selectedIndex };
          default:
            return { action: 'NONE', selectedIndex };
        }
      case 'VICTORY':
        return { action: 'NEXT_LEVEL', selectedIndex };
      case 'DEFEAT':
        return { action: 'RESTART', selectedIndex };
      default:
        return { action: 'NONE', selectedIndex };
    }
  }

  private renderDecorativePattern(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.lineWidth = 1;

    const spacing = 40;
    for (let x = 0; x < CANVAS_WIDTH; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(196, 30, 58, 0.15)';
    ctx.lineWidth = 2;
    const borderSize = 30;
    ctx.strokeRect(borderSize, borderSize, CANVAS_WIDTH - borderSize * 2, CANVAS_HEIGHT - borderSize * 2);

    ctx.restore();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
