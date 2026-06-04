import type { Character } from '../types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export interface HUDPlayer extends Character {
  combo: number;
}

export class HUD {
  private readonly AVATAR_SIZE = 64;
  private readonly HEALTH_BAR_WIDTH = 250;
  private readonly HEALTH_BAR_HEIGHT = 24;
  private readonly KI_BAR_WIDTH = 250;
  private readonly KI_BAR_HEIGHT = 14;
  private readonly BOSS_BAR_WIDTH = 600;
  private readonly BOSS_BAR_HEIGHT = 32;

  render(
    ctx: CanvasRenderingContext2D,
    player: HUDPlayer,
    level: number,
    score: number,
    combo: number,
    showBossBar: boolean,
    bossHealth: number,
    bossMaxHealth: number,
    bossName?: string
  ): void {
    ctx.save();

    this.renderPlayerHUD(ctx, player);
    this.renderScoreHUD(ctx, level, score, combo);

    if (showBossBar && bossName) {
      this.renderBossBar(ctx, bossName, bossHealth, bossMaxHealth);
    }

    ctx.restore();
  }

  private renderPlayerHUD(ctx: CanvasRenderingContext2D, player: HUDPlayer): void {
    const padding = 20;
    const startX = padding;
    const startY = padding;

    this.renderAvatar(ctx, startX, startY);

    const barX = startX + this.AVATAR_SIZE + 16;
    const barY = startY + 8;

    this.renderHealthBar(
      ctx,
      barX,
      barY,
      this.HEALTH_BAR_WIDTH,
      this.HEALTH_BAR_HEIGHT,
      player.health,
      player.maxHealth,
      COLORS.HEALTH_FILL
    );

    this.renderKiBar(
      ctx,
      barX,
      barY + this.HEALTH_BAR_HEIGHT + 8,
      this.KI_BAR_WIDTH,
      this.KI_BAR_HEIGHT,
      player.ki,
      player.maxKi
    );

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HP', barX, barY - 4);
    ctx.fillText('气', barX, barY + this.HEALTH_BAR_HEIGHT + 4);
  }

  private renderAvatar(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const size = this.AVATAR_SIZE;
    const radius = size / 2;

    ctx.fillStyle = COLORS.UI_BG;
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + radius, y + radius, radius - 4, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = COLORS.CHINA_RED;
    ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

    ctx.fillStyle = COLORS.INK_BLACK;
    const headSize = size * 0.45;
    const headX = x + size / 2 - headSize / 2;
    const headY = y + size * 0.15;
    ctx.beginPath();
    ctx.arc(headX + headSize / 2, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.ANCIENT_GOLD;
    const eyeSize = headSize * 0.15;
    const eyeY = headY + headSize * 0.45;
    ctx.beginPath();
    ctx.arc(headX + headSize * 0.35, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(headX + headSize * 0.65, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.INK_BLACK;
    const beltY = y + size * 0.6;
    const beltHeight = size * 0.1;
    ctx.fillRect(x + 4, beltY, size - 8, beltHeight);

    ctx.restore();
  }

  renderHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    current: number,
    max: number,
    color: string
  ): void {
    const percentage = Math.max(0, Math.min(1, current / max));

    ctx.fillStyle = COLORS.UI_BG;
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, x, y, width, height, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.HEALTH_BG;
    this.drawRoundedRect(ctx, x + 3, y + 3, width - 6, height - 6, 2);
    ctx.fill();

    const fillWidth = (width - 6) * percentage;
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.darkenColor(color, 0.3));
      ctx.fillStyle = gradient;
      this.drawRoundedRect(ctx, x + 3, y + 3, fillWidth, height - 6, 2);
      ctx.fill();
    }

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(current)} / ${max}`, x + width / 2, y + height - 6);
  }

  renderKiBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    current: number,
    max: number
  ): void {
    const percentage = Math.max(0, Math.min(1, current / max));

    ctx.fillStyle = COLORS.UI_BG;
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, x, y, width, height, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.KI_BG;
    this.drawRoundedRect(ctx, x + 2, y + 2, width - 4, height - 4, 2);
    ctx.fill();

    const fillWidth = (width - 4) * percentage;
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, COLORS.KI_FILL);
      gradient.addColorStop(1, this.darkenColor(COLORS.KI_FILL, 0.3));
      ctx.fillStyle = gradient;
      this.drawRoundedRect(ctx, x + 2, y + 2, fillWidth, height - 4, 2);
      ctx.fill();

      if (percentage >= 1) {
        ctx.shadowColor = COLORS.KI_FILL;
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(74, 144, 217, 0.5)';
        this.drawRoundedRect(ctx, x + 2, y + 2, fillWidth, height - 4, 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(current)} / ${max}`, x + width / 2, y + height - 3);
  }

  private renderScoreHUD(
    ctx: CanvasRenderingContext2D,
    level: number,
    score: number,
    combo: number
  ): void {
    const padding = 20;
    const startX = CANVAS_WIDTH - padding;
    const startY = padding;

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`得分: ${score.toLocaleString()}`, startX, startY + 20);

    ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    const levelNames = [
      '第一关：少室山脚',
      '第二关：竹林深处',
      '第三关：古刹门前',
      '第四关：藏经阁',
      '第五关：达摩院',
      '第六关：大雄宝殿',
      '第七关：思过崖',
      '第八关：华山之巅',
      '第九关：紫禁之巅',
      '第十关：武道巅峰'
    ];
    ctx.fillText(levelNames[level] || `第${level + 1}关`, startX, startY + 45);

    if (combo > 1) {
      this.renderCombo(ctx, startX, startY + 80, combo);
    }
  }

  renderCombo(ctx: CanvasRenderingContext2D, x: number, y: number, count: number): void {
    ctx.save();

    const scale = 1 + Math.min(count * 0.02, 0.5);
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    if (count >= 10) {
      ctx.shadowColor = COLORS.HIGHLIGHT;
      ctx.shadowBlur = 20;
    }

    ctx.font = 'bold 32px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = count >= 10 ? COLORS.HIGHLIGHT : COLORS.CHINA_RED;
    ctx.fillText(`${count}`, 0, 0);

    ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.fillText('连击!', -60, 0);

    ctx.restore();
  }

  renderBossBar(
    ctx: CanvasRenderingContext2D,
    bossName: string,
    current: number,
    max: number
  ): void {
    const x = (CANVAS_WIDTH - this.BOSS_BAR_WIDTH) / 2;
    const y = CANVAS_HEIGHT - 60;

    ctx.fillStyle = COLORS.SHADOW;
    ctx.fillRect(0, y - 10, CANVAS_WIDTH, this.BOSS_BAR_HEIGHT + 20);

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bossName, CANVAS_WIDTH / 2, y - 15);

    ctx.fillStyle = COLORS.UI_BG;
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 3;
    this.drawRoundedRect(ctx, x, y, this.BOSS_BAR_WIDTH, this.BOSS_BAR_HEIGHT, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.HEALTH_BG;
    this.drawRoundedRect(ctx, x + 4, y + 4, this.BOSS_BAR_WIDTH - 8, this.BOSS_BAR_HEIGHT - 8, 4);
    ctx.fill();

    const percentage = Math.max(0, Math.min(1, current / max));
    const fillWidth = (this.BOSS_BAR_WIDTH - 8) * percentage;
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(x, y, x, y + this.BOSS_BAR_HEIGHT);
      gradient.addColorStop(0, COLORS.CHINA_RED);
      gradient.addColorStop(0.5, '#FF4444');
      gradient.addColorStop(1, COLORS.CHINA_RED);
      ctx.fillStyle = gradient;
      this.drawRoundedRect(ctx, x + 4, y + 4, fillWidth, this.BOSS_BAR_HEIGHT - 8, 4);
      ctx.fill();

      ctx.shadowColor = COLORS.CHINA_RED;
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(196, 30, 58, 0.3)';
      this.drawRoundedRect(ctx, x + 4, y + 4, fillWidth, this.BOSS_BAR_HEIGHT - 8, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${Math.ceil(current)} / ${max}`,
      CANVAS_WIDTH / 2,
      y + this.BOSS_BAR_HEIGHT - 8
    );
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

  private darkenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }
}
