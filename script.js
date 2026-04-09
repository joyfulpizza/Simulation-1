function start() {
  const speed = document.getElementById("speed").value;
  const amount = document.getElementById("amount").value;
  const mode = document.getElementById("mode").value;

  const url = `sim.html?speed=${speed}&amount=${amount}&mode=${mode}`;
  window.open(url, "_blank");
}
