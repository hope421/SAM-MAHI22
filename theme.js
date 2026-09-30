var root = document.documentElement;
var btn = document.getElementById("themeBtn");
var saved = localStorage.getItem("theme");

if (saved) root.setAttribute("data-theme", saved);
else if (matchMedia("(prefers-color-scheme:dark)").matches)
  root.setAttribute("data-theme", "dark");

btn.onclick = function () {
  var dark = root.getAttribute("data-theme") === "dark";
  root.setAttribute("data-theme", dark ? "light" : "dark");
  localStorage.setItem("theme", dark ? "light" : "dark");
};
