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
    this.friends = [];
  }

  move() {
    if (!this.target) {
      this.x += (Math.random() - 0.5) * speedMultiplier;
      this.y += (Math.random() - 0.5) * speedMultiplier;
    } else {
      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;
      let dist = Math.sqrt(dx*dx + dy*dy);

      if (dist > 0) {
        this.x += (dx/dist) * speedMultiplier;
        this.y += (dy/dist) * speedMultiplier;
      }

      if (dist < 10) {
        this.target.health -= 1;

        // PvP retaliation
        this.target.target = this;
      }
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

let groups = [];
let people = [];

// Create groups
for (let i = 0; i < amount; i++) {
  let groupSize = Math.floor(Math.random() * 2) + 2; // 2-3
  let group = [];
  
  for (let j = 0; j < groupSize; j++) {
    let p = new Person(Math.random()*800, Math.random()*600, i);
    group.push(p);
    people.push(p);
  }

  // Assign friends
  group.forEach(p => {
    p.friends = group.filter(x => x !== p);
  });

  group.leader = group[0];
  groups.push(group);
}

// Target selection
function assignTargets() {
  groups.forEach(group => {
    let leader = group.leader;

    let closestGroup = null;
    let minDist = Infinity;

    groups.forEach(other => {
      if (other === group) return;

      let dx = other[0].x - leader.x;
      let dy = other[0].y - leader.y;
      let dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < minDist && dist < 100) {
        minDist = dist;
        closestGroup = other;
      }
    });

    if (closestGroup) {
      group.forEach((member, i) => {
        member.target = closestGroup[i % closestGroup.length];
      });
    }
  });
}

function drawConnections() {
  ctx.strokeStyle = "gray";
  people.forEach(p => {
    p.friends.forEach(f => {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(f.x, f.y);
      ctx.stroke();
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
