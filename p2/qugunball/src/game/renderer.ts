import type {
  GameState,
  Goal,
  IceTrail,
  Item,
  ItemType,
  Particle,
  Player,
  Puck,
  PuckState,
  ScreenShake,
  Vec2,
} from './types';
import { RINK, PLAYER_RADIUS, PUCK_RADIUS } from './types';

function fi(n: number): number {
  return Math.floor(n);
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private frameCount = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  render(state: GameState) {
    this.frameCount++;
    const ctx = this.ctx;
    ctx.save();
    this.drawScreenShake(state.screenShake);
    this.clear();
    this.drawRink();
    this.drawIceTrails(state.iceTrails);
    this.drawGoals(state.goals);
    this.drawItems(state.items);
    this.drawPuck(state.puck);
    this.drawPlayers(state.players);
    this.drawParticles(state.particles);
    this.drawHUD(state);
    ctx.restore();
  }

  clear() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawRink() {
    const ctx = this.ctx;
    const w = RINK.width;
    const h = RINK.height;
    const bt = RINK.boardThickness;
    const cr = RINK.cornerRadius;
    const ccr = RINK.centerCircleRadius;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#E8F4FD');
    grad.addColorStop(0.5, '#D6ECFA');
    grad.addColorStop(1, '#E8F4FD');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawRinkShape(w, h, bt, cr);
    ctx.fill();

    ctx.strokeStyle = '#CC3333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fi(w / 2), bt);
    ctx.lineTo(fi(w / 2), h - bt);
    ctx.stroke();

    ctx.strokeStyle = '#3355BB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fi(w / 3), bt);
    ctx.lineTo(fi(w / 3), h - bt);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(fi((2 * w) / 3), bt);
    ctx.lineTo(fi((2 * w) / 3), h - bt);
    ctx.stroke();

    ctx.strokeStyle = '#3355BB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fi(w / 2), fi(h / 2), ccr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#3355BB';
    const dotR = 4;
    const faceoffDots: Vec2[] = [
      { x: fi(w / 3), y: fi(h / 4) },
      { x: fi(w / 3), y: fi((3 * h) / 4) },
      { x: fi((2 * w) / 3), y: fi(h / 4) },
      { x: fi((2 * w) / 3), y: fi((3 * h) / 4) },
    ];
    for (const dot of faceoffDots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#3355BB';
    ctx.beginPath();
    ctx.arc(fi(w / 2), fi(h / 2), dotR, 0, Math.PI * 2);
    ctx.fill();

    const goalW = RINK.goalWidth;
    const goalD = RINK.goalDepth;

    ctx.fillStyle = 'rgba(220, 60, 60, 0.15)';
    ctx.beginPath();
    ctx.arc(bt, fi(h / 2), fi(goalW / 2), -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(60, 60, 220, 0.15)';
    ctx.beginPath();
    ctx.arc(w - bt, fi(h / 2), fi(goalW / 2), Math.PI / 2, -Math.PI / 2);
    ctx.fill();

    ctx.fillStyle = '#8B6914';
    this.drawRinkShape(w, h, bt, cr);
    ctx.lineWidth = bt;
    ctx.strokeStyle = '#8B6914';
    ctx.stroke();

    ctx.strokeStyle = '#6B4F12';
    ctx.lineWidth = 2;
    this.drawRinkShape(w, h, bt, cr);
    ctx.stroke();
  }

  private drawRinkShape(w: number, h: number, bt: number, cr: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(bt + cr, bt);
    ctx.lineTo(w - bt - cr, bt);
    ctx.arcTo(w - bt, bt, w - bt, bt + cr, cr);
    ctx.lineTo(w - bt, h - bt - cr);
    ctx.arcTo(w - bt, h - bt, w - bt - cr, h - bt, cr);
    ctx.lineTo(bt + cr, h - bt);
    ctx.arcTo(bt, h - bt, bt, h - bt - cr, cr);
    ctx.lineTo(bt, bt + cr);
    ctx.arcTo(bt, bt, bt + cr, bt, cr);
    ctx.closePath();
  }

  drawIceTrails(trails: IceTrail[]) {
    const ctx = this.ctx;
    for (const trail of trails) {
      if (trail.points.length < 2) continue;
      ctx.strokeStyle = trail.team === 'red'
        ? `rgba(200, 150, 150, ${trail.alpha * 0.3})`
        : `rgba(150, 150, 200, ${trail.alpha * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fi(trail.points[0].x), fi(trail.points[0].y));
      for (let i = 1; i < trail.points.length; i++) {
        ctx.lineTo(fi(trail.points[i].x), fi(trail.points[i].y));
      }
      ctx.stroke();
    }
  }

  drawGoals(goals: Goal[]) {
    const ctx = this.ctx;
    for (const goal of goals) {
      ctx.save();
      let sx = 0;
      let sy = 0;
      if (goal.shakeTimer > 0) {
        sx = (Math.random() - 0.5) * 4;
        sy = (Math.random() - 0.5) * 4;
      }
      ctx.translate(sx, sy);

      const gx = fi(goal.x);
      const gy = fi(goal.y);
      const gw = fi(goal.width);
      const gd = fi(goal.depth);
      const isLeft = goal.team === 'red';

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      if (isLeft) {
        ctx.fillRect(gx - gd, gy - gw / 2, gd, gw);
      } else {
        ctx.fillRect(gx, gy - gw / 2, gd, gw);
      }

      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 1;
      const netSpacing = 8;
      const startX = isLeft ? gx - gd : gx;
      const endX = isLeft ? gx : gx + gd;
      for (let ny = gy - gw / 2; ny <= gy + gw / 2; ny += netSpacing) {
        ctx.beginPath();
        ctx.moveTo(startX, ny);
        ctx.lineTo(endX, ny);
        ctx.stroke();
      }
      for (let nx = startX; nx <= endX; nx += netSpacing) {
        ctx.beginPath();
        ctx.moveTo(nx, gy - gw / 2);
        ctx.lineTo(nx, gy + gw / 2);
        ctx.stroke();
      }

      const frameColor = goal.team === 'red' ? '#CC3333' : '#3355CC';
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3;
      if (isLeft) {
        ctx.strokeRect(gx - gd, gy - gw / 2, gd, gw);
      } else {
        ctx.strokeRect(gx, gy - gw / 2, gd, gw);
      }

      ctx.fillStyle = '#DDDDDD';
      ctx.fillRect(isLeft ? gx - 2 : gx - 1, gy - gw / 2 - 3, 4, gw + 6);

      ctx.restore();
    }
  }

  drawPlayers(players: Player[]) {
    const sorted = [...players].sort((a, b) => a.pos.y - b.pos.y);
    for (const player of sorted) {
      this.drawPlayer(player);
    }
  }

  drawPlayer(player: Player) {
    const ctx = this.ctx;
    const px = fi(player.pos.x);
    const py = fi(player.pos.y);
    const isMoving = Math.abs(player.vel.x) > 0.3 || Math.abs(player.vel.y) > 0.3;
    const legOffset = isMoving ? Math.sin(this.frameCount * 0.3) * 3 : 0;

    if (player.state === 'down') {
      this.drawPlayerDown(player, px, py);
      return;
    }

    ctx.save();
    ctx.translate(px, py);

    if (player.state === 'charging_special') {
      const pulse = Math.sin(this.frameCount * 0.15) * 0.3 + 0.5;
      const auraColor = player.team === 'red'
        ? `rgba(255, 100, 50, ${pulse})`
        : `rgba(50, 100, 255, ${pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_RADIUS + 6 + Math.sin(this.frameCount * 0.1) * 2, 0, Math.PI * 2);
      ctx.fillStyle = auraColor;
      ctx.fill();
    }

    if (player.isControlled) {
      const pulse = Math.sin(this.frameCount * 0.1) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(0, PLAYER_RADIUS + 4, PLAYER_RADIUS + 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = player.colors.body;
    ctx.fillRect(-10, -8, 20, 16);

    ctx.fillStyle = player.colors.stripe;
    ctx.fillRect(-10, -2, 20, 4);

    ctx.fillStyle = player.colors.helmet;
    ctx.beginPath();
    ctx.arc(0, -12, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(0, -10, 5, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = player.colors.body;
    const legW = 4;
    const legH = 5;
    ctx.fillRect(-7, 8 + legOffset, legW, legH);
    ctx.fillRect(3, 8 - legOffset, legW, legH);

    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth = 3;
    const stickEndX = Math.cos(player.stickAngle) * player.stickLength;
    const stickEndY = Math.sin(player.stickAngle) * player.stickLength;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(fi(stickEndX), fi(stickEndY));
    ctx.stroke();

    ctx.strokeStyle = '#6B3E1C';
    ctx.lineWidth = 2;
    const bladeLen = 5;
    const bladeAngle = player.stickAngle + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(fi(stickEndX), fi(stickEndY));
    ctx.lineTo(
      fi(stickEndX + Math.cos(bladeAngle) * bladeLen),
      fi(stickEndY + Math.sin(bladeAngle) * bladeLen)
    );
    ctx.stroke();

    if (player.hasPuck) {
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(fi(stickEndX), fi(stickEndY), PUCK_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    this.drawPlayerStateEffect(player);

    if (player.isControlled) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, 0, -22);
    }

    if (player.maxSpecialCharge > 0) {
      const barW = 18;
      const barH = 3;
      const bx = -barW / 2;
      const by = 16;
      const chargeRatio = player.specialCharge / player.maxSpecialCharge;
      ctx.fillStyle = '#333333';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = chargeRatio >= 1 ? '#FFD700' : '#44CC44';
      ctx.fillRect(bx, by, fi(barW * chargeRatio), barH);
    }

    if (player.activeItem) {
      this.drawPlayerItemIcon(player);
    }

    ctx.restore();
  }

  private drawPlayerDown(player: Player, px: number, py: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI / 2);

    ctx.fillStyle = player.colors.body;
    ctx.fillRect(-10, -4, 20, 8);

    ctx.fillStyle = player.colors.helmet;
    ctx.beginPath();
    ctx.arc(-10, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    const starPhase = this.frameCount * 0.1;
    for (let i = 0; i < 3; i++) {
      const angle = starPhase + (i * Math.PI * 2) / 3;
      const sx = Math.cos(angle) * 12;
      const sy = -10 + Math.sin(angle * 2) * 3;
      this.drawStar(sx, sy, 3, '#FFD700');
    }

    ctx.restore();
  }

  private drawPlayerStateEffect(player: Player) {
    const ctx = this.ctx;

    if (player.state === 'frozen') {
      ctx.fillStyle = 'rgba(100, 180, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_RADIUS + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#88DDFF';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const cx = Math.cos(a) * (PLAYER_RADIUS + 4);
        const cy = Math.sin(a) * (PLAYER_RADIUS + 4);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a + 0.5) * 4, cy + Math.sin(a + 0.5) * 4);
        ctx.lineTo(cx + Math.cos(a - 0.5) * 4, cy + Math.sin(a - 0.5) * 4);
        ctx.closePath();
        ctx.stroke();
      }
    }

    if (player.state === 'paralyzed') {
      const phase = this.frameCount * 0.5;
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = phase + (i / 4) * Math.PI * 2;
        const dist = PLAYER_RADIUS + 3;
        const sx = Math.cos(a) * dist;
        const sy = Math.sin(a) * dist;
        ctx.beginPath();
        ctx.moveTo(sx - 2, sy - 2);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx + 2, sy - 4);
        ctx.stroke();
      }
    }

    if (player.state === 'celebrating') {
      ctx.fillStyle = player.colors.body;
      ctx.fillRect(-14, -14, 4, 8);
      ctx.fillRect(10, -14, 4, 8);

      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(-12, -16, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(12, -16, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (player.state === 'angry') {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(-3, -16, 2, 2);
      ctx.fillRect(1, -16, 2, 2);

      const slamOffset = Math.sin(this.frameCount * 0.4) * 2;
      ctx.strokeStyle = '#8B5E3C';
      ctx.lineWidth = 4;
      const stickEndX = Math.cos(player.stickAngle) * (player.stickLength + slamOffset);
      const stickEndY = Math.sin(player.stickAngle) * (player.stickLength + slamOffset);
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(fi(stickEndX), fi(stickEndY));
      ctx.stroke();
    }
  }

  private drawPlayerItemIcon(player: Player) {
    const ctx = this.ctx;
    const ix = 12;
    const iy = -8;
    const s = 4;

    ctx.save();
    ctx.translate(ix, iy);

    switch (player.activeItem) {
      case 'speed_skates':
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-s / 2, -s, s, s * 2);
        ctx.fillRect(-s, -s / 2, s * 2, 1);
        break;
      case 'long_stick':
        ctx.strokeStyle = '#5588FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s, s);
        ctx.lineTo(s, -s);
        ctx.stroke();
        break;
      case 'freeze_ball':
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
          ctx.stroke();
        }
        break;
      case 'shock_ball':
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s, -s / 2);
        ctx.lineTo(0, s);
        ctx.lineTo(s / 2, -s);
        ctx.lineTo(0, 0);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }

  drawPuck(puck: Puck) {
    const ctx = this.ctx;
    const px = fi(puck.pos.x);
    const py = fi(puck.pos.y);

    if (puck.state === 'split' && puck.splitPucks) {
      for (let i = 0; i < puck.splitPucks.length; i++) {
        const sp = puck.splitPucks[i];
        const spx = fi(sp.pos.x);
        const spy = fi(sp.pos.y);
        ctx.globalAlpha = i === 0 ? 1 : 0.4;
        this.drawPuckBase(spx, spy, sp.state);
      }
      ctx.globalAlpha = 1;
      return;
    }

    if (puck.state === 'curve' && puck.curveDirection !== undefined) {
      const trailCount = 4;
      for (let i = trailCount; i >= 0; i--) {
        const t = i / trailCount;
        const tx = px - puck.vel.x * i * 2 + puck.curveDirection * i * 1.5;
        const ty = py - puck.vel.y * i * 2;
        ctx.globalAlpha = 1 - t * 0.7;
        this.drawPuckBase(fi(tx), fi(ty), 'normal');
      }
      ctx.globalAlpha = 1;
    }

    if (puck.state === 'whirlwind') {
      const angle = this.frameCount * 0.3;
      for (let i = 0; i < 6; i++) {
        const a = angle + (i / 6) * Math.PI * 2;
        const dist = 10 + Math.sin(this.frameCount * 0.2 + i) * 3;
        ctx.strokeStyle = `rgba(100, 180, 255, ${0.5 - i * 0.07})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          px + Math.cos(a) * dist,
          py + Math.sin(a) * dist,
          4,
          a,
          a + Math.PI * 0.6
        );
        ctx.stroke();
      }
    }

    this.drawPuckBase(px, py, puck.state);
  }

  private drawPuckBase(px: number, py: number, state: PuckState) {
    const ctx = this.ctx;

    if (state === 'fire') {
      const flicker = Math.sin(this.frameCount * 0.5) * 2;
      ctx.fillStyle = 'rgba(255, 100, 20, 0.3)';
      ctx.beginPath();
      ctx.arc(px, py, PUCK_RADIUS + 4 + flicker, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 3; i++) {
        const fx = px + (Math.random() - 0.5) * 8;
        const fy = py - Math.random() * 8;
        const fs = 2 + Math.random() * 2;
        ctx.fillStyle = i === 0 ? '#FF4400' : i === 1 ? '#FF8800' : '#FFCC00';
        ctx.beginPath();
        ctx.arc(fi(fx), fi(fy), fs, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = state === 'fire' ? '#331100' : '#111111';
    ctx.beginPath();
    ctx.arc(px, py, PUCK_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = state === 'fire' ? '#FF6600' : '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, PUCK_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawItems(items: Item[]) {
    for (const item of items) {
      if (item.collected) continue;
      this.drawItem(item);
    }
  }

  private drawItem(item: Item) {
    const ctx = this.ctx;
    const ix = fi(item.pos.x);
    const iy = fi(item.pos.y);
    const pulse = Math.sin(this.frameCount * 0.08) * 0.3 + 0.7;

    ctx.save();
    ctx.translate(ix, iy);

    const glowColors: Record<ItemType, string> = {
      speed_skates: 'rgba(255, 215, 0, 0.2)',
      long_stick: 'rgba(85, 136, 255, 0.2)',
      freeze_ball: 'rgba(0, 255, 255, 0.2)',
      shock_ball: 'rgba(255, 255, 0, 0.2)',
    };
    ctx.fillStyle = glowColors[item.type];
    ctx.beginPath();
    ctx.arc(0, 0, 12 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();

    this.drawItemIcon(item.type, 0, 0);

    ctx.restore();
  }

  private drawItemIcon(type: ItemType, cx: number, cy: number) {
    const ctx = this.ctx;
    const s = 5;

    switch (type) {
      case 'speed_skates': {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(cx - 2, cy - s, 5, s);
        ctx.fillRect(cx - 3, cy, 7, 3);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy - s + 1);
        ctx.lineTo(cx + 8, cy - s - 1);
        ctx.moveTo(cx + 5, cy - s + 3);
        ctx.lineTo(cx + 8, cy - s + 1);
        ctx.stroke();
        break;
      }
      case 'long_stick': {
        ctx.strokeStyle = '#5588FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy + s);
        ctx.lineTo(cx + s, cy - s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + s, cy - s);
        ctx.lineTo(cx + s - 2, cy - s + 4);
        ctx.stroke();
        break;
      }
      case 'freeze_ball': {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
          ctx.stroke();
        }
        break;
      }
      case 'shock_ball': {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - 2);
        ctx.lineTo(cx - 1, cy);
        ctx.lineTo(cx + 2, cy - s);
        ctx.lineTo(cx + 1, cy);
        ctx.lineTo(cx + s, cy + 2);
        ctx.stroke();
        break;
      }
    }
  }

  drawParticles(particles: Particle[]) {
    for (const p of particles) {
      this.drawParticle(p);
    }
  }

  private drawParticle(p: Particle) {
    const ctx = this.ctx;
    const alpha = p.life / p.maxLife;
    const px = fi(p.pos.x);
    const py = fi(p.pos.y);
    const size = Math.max(1, fi(p.size * alpha));

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = alpha;

    switch (p.type) {
      case 'ice': {
        ctx.fillStyle = p.color || '#DDF4FF';
        ctx.fillRect(-size / 2, -size / 2, size, size);
        break;
      }
      case 'spark': {
        ctx.fillStyle = p.color || '#FFCC00';
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'star': {
        ctx.fillStyle = p.color || '#FFD700';
        this.drawStarShape(0, 0, size, 5);
        break;
      }
      case 'confetti': {
        ctx.fillStyle = p.color || '#FF6688';
        ctx.fillRect(-size / 2, -size / 4, size, size / 2);
        break;
      }
      case 'fire': {
        ctx.fillStyle = p.color || '#FF6600';
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'whirlwind': {
        ctx.strokeStyle = p.color || '#88CCFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI);
        ctx.stroke();
        break;
      }
      case 'snow': {
        ctx.fillStyle = p.color || '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1, size / 2), 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawStar(x: number, y: number, r: number, color: string) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    this.drawStarShape(x, y, r, 5);
  }

  private drawStarShape(cx: number, cy: number, r: number, points: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const dist = i % 2 === 0 ? r : r * 0.4;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  drawHUD(state: GameState) {
    const ctx = this.ctx;
    const w = RINK.width;
    const cx = fi(w / 2);

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(cx - 80, 4, 160, 36);

    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(state.score.red), cx - 12, 30);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('-', cx, 28);

    ctx.fillStyle = '#4488FF';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(String(state.score.blue), cx + 12, 30);

    const totalSec = Math.max(0, Math.ceil(state.timeRemaining));
    const mins = fi(totalSec / 60);
    const secs = totalSec % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    ctx.fillStyle = totalSec <= 30 ? '#FF4444' : '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, cx, 42);

    if (state.faceoff) {
      const flash = Math.sin(this.frameCount * 0.15) > 0;
      if (flash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FACEOFF!', cx, fi(RINK.height / 2) - 40);
      }
    }

    if (state.celebrationTimer > 0 && state.lastGoalTeam) {
      const goalAlpha = Math.min(1, state.celebrationTimer / 30);
      ctx.globalAlpha = goalAlpha;
      const teamColor = state.lastGoalTeam === 'red' ? '#FF4444' : '#4488FF';
      ctx.fillStyle = teamColor;
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GOAL!', cx, fi(RINK.height / 2) - 20);
      ctx.globalAlpha = 1;
    }

    if (state.isPaused && !state.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, RINK.width, RINK.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', cx, fi(RINK.height / 2));
    }

    if (state.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, RINK.width, RINK.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', cx, fi(RINK.height / 2) - 15);
      const winner = state.score.red > state.score.blue ? 'RED WINS!'
        : state.score.blue > state.score.red ? 'BLUE WINS!'
        : 'DRAW!';
      const winColor = state.score.red > state.score.blue ? '#FF4444'
        : state.score.blue > state.score.red ? '#4488FF'
        : '#FFFFFF';
      ctx.fillStyle = winColor;
      ctx.font = 'bold 22px monospace';
      ctx.fillText(winner, cx, fi(RINK.height / 2) + 15);
    }

    if (state.comboReady.red) {
      const pulse = Math.sin(this.frameCount * 0.1) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 200, 50, ${pulse})`;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('COMBO!', 20, 20);
    }
    if (state.comboReady.blue) {
      const pulse = Math.sin(this.frameCount * 0.1) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 200, 50, ${pulse})`;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('COMBO!', w - 20, 20);
    }

    ctx.restore();
  }

  drawScreenShake(shake: ScreenShake) {
    if (shake.timer <= 0 || shake.duration <= 0) return;
    const ctx = this.ctx;
    const progress = shake.timer / shake.duration;
    const intensity = shake.intensity * progress;
    const dx = (Math.random() - 0.5) * 2 * intensity;
    const dy = (Math.random() - 0.5) * 2 * intensity;
    ctx.translate(dx, dy);
  }
}
