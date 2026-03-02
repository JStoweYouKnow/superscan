interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  burst(x: number, y: number, count: number, color: string, speed = 80): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 30,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color,
        size: 1 + Math.random() * 2,
      });
    }
  }

  sparkle(x: number, y: number, color: string): void {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 20,
      vy: -20 - Math.random() * 30,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      color,
      size: 1 + Math.random(),
    });
  }

  trail(x: number, y: number, color: string): void {
    this.particles.push({
      x, y, vx: (Math.random() - 0.5) * 10, vy: -5,
      life: 0.15, maxLife: 0.15, color, size: 1,
    });
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt; // gravity
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
    }
    ctx.globalAlpha = 1;
  }
}
