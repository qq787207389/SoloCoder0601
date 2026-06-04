import {
  PlayerState,
  KeyState,
  Vector2,
  PLAYER_SPEED,
  PLAYER_SIZE,
  COURT_X,
  COURT_WIDTH,
  COURT_Y,
  COURT_HEIGHT,
  MAX_STAMINA,
  STAMINA_REGEN,
  STUN_DURATION,
  SWING_DURATION
} from '../index';

export function updatePlayer(
  player: PlayerState, keys: KeyState, dt: number, isPlayer: boolean): void {
  if (player.isStunned) {
    player.stunTimer -= dt;
    if (player.stunTimer <= 0) {
      player.isStunned = false;
    }
    player.velocity.x *= 0.9;
    player.velocity.y *= 0.9;
  } else {
    let dx = 0;
    let dy = 0;

    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    player.velocity.x = dx * PLAYER_SPEED;
    player.velocity.y = dy * PLAYER_SPEED;
  }

  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;

  const halfSize = PLAYER_SIZE / 2;
  const minX = isPlayer ? COURT_X + halfSize : COURT_X + COURT_WIDTH / 2 + halfSize;
  const maxX = isPlayer ? COURT_X + COURT_WIDTH / 2 - halfSize : COURT_X + COURT_WIDTH - halfSize;

  player.position.x = Math.max(minX, Math.min(maxX, player.position.x));
  player.position.y = Math.max(COURT_Y + halfSize, Math.min(COURT_Y + COURT_HEIGHT - halfSize, player.position.y));

  if (player.isSwinging) {
    player.swingTimer -= dt;
    if (player.swingTimer <= 0) {
      player.isSwinging = false;
    }
  }

  if (!player.isStunned && player.stamina < MAX_STAMINA) {
    player.stamina = Math.min(MAX_STAMINA, player.stamina + STAMINA_REGEN * dt);
  }
}

export function startSwing(player: PlayerState): void {
  if (!player.isStunned && !player.isSwinging) {
    player.isSwinging = true;
    player.swingTimer = SWING_DURATION;
  }
}

export function stunPlayer(player: PlayerState): void {
  player.isStunned = true;
  player.stunTimer = STUN_DURATION;
  player.isSwinging = false;
}

export function getDistance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
