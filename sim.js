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

class Person {
  constructor(x, y, group) {
    this.x = x;
    this.y = y;
    this.group = group;
    this.health = 10;
    this.target = null;
  }

  move() {
    // Move toward target if exists
    if (this.target && this.target.health > 0) {
      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;
      let dist = Math.sqrt(dx*dx + dy*dy);

      if (dist > 0) {
        this.x += (dx/dist) * speedMultiplier;
        this.y += (dy/dist) * speedMultiplier;
      }

      if (dist < 10) {
        this.target.health -= 1;
        this.target.target = this; // retaliation
      }

    } else {
      // Cohesion movement (stick to group center)
      let center = this.group.center();
      let dx = center.x - this.x;
      let dy = center.y - this.y;

      this.x += dx * 0.02 * speedMultiplier;
      this.y += dy * 0.02 * speedMultiplier;
    }
  }

  draw() {
    ctx.strokeStyle = this.group.color;
    ctx.strokeRect(this.x, this.y, 10, 10);

    // health bar
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 5, this.health, 3);
  }
}

class Group {
  constructor() {
    this.members = [];
    this.color = `rgb(${rand(50,255)}, ${rand(50,255)}, ${rand(50,255)})`;
    this.targetGroup = null;
    this.cooldown = 0;
  }

  center() {
    let x = 0, y = 0;
    this.members.forEach(p => {
      x += p.x;
      y += p.y;
    });
    return {
      x: x / this.members.length,
      y: y / this.members.length
    };
  }
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

let groups = [];
let people = [];

// Create groups
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

// Engagement system (FIXED)
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
      g.cooldown = 120; // prevents flicker

      g.members.forEach((p, i) => {
        let target = nearby.members[i % nearby.members.length];
        p.target = target;
      });
    }
  });
}

// Draw friend connections
function drawConnections() {
  people.forEach(p => {
    p.group.members.forEach(f => {
      if (p !== f) {
        ctx.strokeStyle = p.group.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(f.x, f.y);
        ctx.stroke();
      }
    });
  });
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  assignTargets();

  people.forEach(p => {
    if (p.health > 0) {
      p.move();
      p.draw();
    }
  });

  drawConnections();

  requestAnimationFrame(update);
}

update();
