const params = new URLSearchParams(window.location.search);
const mode = params.get("mode");
const amount = parseInt(params.get("amount"));
const speedSetting = params.get("speed");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

if (mode !== "killer") {
  document.body.innerHTML = "<h1>nope</h1>";
  throw new Error("Not killer mode");
}

let speedMultiplier = {
  fast: 2,
  normal: 1,
  slow: 0.5
}[speedSetting] || 1;

// ================= PERSON =================
class Person {
  constructor(x, y, group) {
    this.x = x;
    this.y = y;
    this.group = group;

    this.health = 10;
    this.target = null;

    // mechanics
    this.invuln = 0;
    this.freeze = 0;
    this.vx = 0;
    this.vy = 0;
  }

  move() {
    if (this.health <= 0) return;

    // timers
    if (this.invuln > 0) this.invuln--;
    if (this.freeze > 0) {
      this.freeze--;
      return;
    }

    // apply knockback velocity
    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.8;
    this.vy *= 0.8;

    // combat movement
    if (this.target && this.target.health > 0) {
      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;
      let dist = Math.sqrt(dx*dx + dy*dy);

      if (dist > 0) {
        this.x += (dx/dist) * speedMultiplier;
        this.y += (dy/dist) * speedMultiplier;
      }

      if (dist < 10 && this.target.invuln <= 0) {
        // damage
        this.target.health -= 1;
        this.target.invuln = 15;

        // knockback
        let kx = (this.target.x - this.x) / dist;
        let ky = (this.target.y - this.y) / dist;

        this.target.vx += kx * 3;
        this.target.vy += ky * 3;

        // retaliation
        this.target.target = this;

        // freeze on kill
        if (this.target.health <= 0) {
          this.freeze = 20;
        }
      }

    } else {
      // group cohesion
      let center = this.group.center();
      let dx = center.x - this.x;
      let dy = center.y - this.y;

      this.x += dx * 0.02 * speedMultiplier;
      this.y += dy * 0.02 * speedMultiplier;
    }
  }

  draw() {
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.x, this.y, 10, 10);

    // health bar
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 5, this.health, 3);
  }
}

// ================= GROUP =================
class Group {
  constructor() {
    this.members = [];
    this.targetGroup = null;
    this.cooldown = 0;
  }

  center() {
    let alive = this.members.filter(p => p.health > 0);
    if (alive.length === 0) return { x: 0, y: 0 };

    let x = 0, y = 0;
    alive.forEach(p => {
      x += p.x;
      y += p.y;
    });

    return {
      x: x / alive.length,
      y: y / alive.length
    };
  }
}

// ================= SETUP =================
let groups = [];
let people = [];

for (let i = 0; i < amount; i++) {
  let g = new Group();
  let size = Math.floor(Math.random() * 2) + 2;

  for (let j = 0; j < size; j++) {
    let p = new Person(Math.random()*800, Math.random()*600, g);
    g.members.push(p);
    people.push(p);
  }

  groups.push(g);
}

// ================= TARGET SYSTEM =================
function assignTargets() {
  groups.forEach(g => {
    if (g.cooldown > 0) {
      g.cooldown--;
      return;
    }

    let center = g.center();

    let nearby = groups.find(other => {
      if (other === g) return false;

      let c2 = other.center();
      let dx = c2.x - center.x;
      let dy = c2.y - center.y;
      let dist = Math.sqrt(dx*dx + dy*dy);

      return dist < 120;
    });

    if (nearby) {
      g.targetGroup = nearby;
      g.cooldown = 120;

      g.members.forEach((p, i) => {
        if (p.health <= 0) return;

        let targets = nearby.members.filter(t => t.health > 0);
        if (targets.length === 0) return;

        p.target = targets[i % targets.length];
      });
    }
  });
}

// ================= DRAW FRIEND LINKS =================
function drawConnections() {
  ctx.strokeStyle = "gray";

  groups.forEach(g => {
    g.members.forEach(p => {
      g.members.forEach(f => {
        if (p !== f && p.health > 0 && f.health > 0) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(f.x, f.y);
          ctx.stroke();
        }
      });
    });
  });
}

// ================= LOOP =================
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  assignTargets();

  people.forEach(p => {
    p.move();
    p.draw();
  });

  drawConnections();

  requestAnimationFrame(update);
}

update();
