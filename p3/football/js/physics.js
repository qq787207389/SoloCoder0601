class PhysicsBody {
    constructor(x, y, radius, mass = 1) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = radius;
        this.mass = mass;
        this.friction = 0.98;
        this.bounciness = 0.6;
    }

    update(dt, gravity = 0) {
        this.vy += gravity;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
    }

    applyForce(fx, fy) {
        this.vx += fx / this.mass;
        this.vy += fy / this.mass;
    }

    setVelocity(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    }

    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }
}

class CollisionResolver {
    static circleCollision(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            const totalMass = a.mass + b.mass;
            const ratioA = b.mass / totalMass;
            const ratioB = a.mass / totalMass;

            a.x -= nx * overlap * ratioA;
            a.y -= ny * overlap * ratioA;
            b.x += nx * overlap * ratioB;
            b.y += ny * overlap * ratioB;

            const relVx = a.vx - b.vx;
            const relVy = a.vy - b.vy;
            const velAlongNormal = relVx * nx + relVy * ny;

            if (velAlongNormal > 0) return;

            const restitution = Math.min(a.bounciness, b.bounciness);
            const j = -(1 + restitution) * velAlongNormal / (1 / a.mass + 1 / b.mass);

            const impulseX = j * nx;
            const impulseY = j * ny;

            a.vx += impulseX / a.mass;
            a.vy += impulseY / a.mass;
            b.vx -= impulseX / b.mass;
            b.vy -= impulseY / b.mass;

            return true;
        }
        return false;
    }

    static resolveCircleCollision(body, otherX, otherY, otherRadius, otherMass = 1) {
        const dx = body.x - otherX;
        const dy = body.y - otherY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = body.radius + otherRadius;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            body.x += nx * overlap;
            body.y += ny * overlap;

            const velAlongNormal = body.vx * nx + body.vy * ny;
            if (velAlongNormal < 0) {
                body.vx -= 2 * velAlongNormal * nx * body.bounciness;
                body.vy -= 2 * velAlongNormal * ny * body.bounciness;
            }
            return true;
        }
        return false;
    }

    static constrainToPitch(body) {
        const left = PITCH_X + body.radius;
        const right = PITCH_X + PITCH_WIDTH - body.radius;
        const top = PITCH_Y + body.radius;
        const bottom = PITCH_Y + PITCH_HEIGHT - body.radius;

        if (body.x < left) {
            body.x = left;
            body.vx = Math.abs(body.vx) * body.bounciness;
        }
        if (body.x > right) {
            body.x = right;
            body.vx = -Math.abs(body.vx) * body.bounciness;
        }
        if (body.y < top) {
            body.y = top;
            body.vy = Math.abs(body.vy) * body.bounciness;
        }
        if (body.y > bottom) {
            body.y = bottom;
            body.vy = -Math.abs(body.vy) * body.bounciness;
        }
    }

    static checkGoal(body) {
        const leftGoalLine = PITCH_X;
        const rightGoalLine = PITCH_X + PITCH_WIDTH;
        const goalTop = PITCH_Y + PITCH_HEIGHT / 2 - GOAL_HEIGHT / 2;
        const goalBottom = PITCH_Y + PITCH_HEIGHT / 2 + GOAL_HEIGHT / 2;

        if (body.x < leftGoalLine && body.y > goalTop && body.y < goalBottom) {
            return 'left';
        }
        if (body.x > rightGoalLine && body.y > goalTop && body.y < goalBottom) {
            return 'right';
        }
        return null;
    }
}
