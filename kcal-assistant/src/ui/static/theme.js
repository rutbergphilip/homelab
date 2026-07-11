// Stamp the saved theme before first paint (CSP forbids inline scripts, and
// app.js is a deferred module — too late). System preference = no attribute.
try {
  var t = localStorage.getItem("kcal.theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
