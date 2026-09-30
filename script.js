import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ============ EDIT THIS PART ============ */
var C = {
  groom: "SAM",
  bride: "MAHI",
  date: "2026-11-01T14:00:00",
  dateText: "Sunday, 1 November 2026",
  timeText: "2:00 PM",
  venue: " ... church",
  address: "Shashemene, 010",
  mapUrl: "https://maps.app.goo.gl/eRybcPeo8YM4fSjc7?g_st=ac",
  photosLink: "https://drive.google.com/",

  heroImage: "images/hero.jpg",
  storyPhoto: "images/story.jpg",
  albumImage: "images/album.jpg", // background photo for the "Share your photos" section

  story: [
    "Write the first part of your story here: how you met.",
    "Write the second part here: how your love grew.",
    "Write the last part here: the proposal and the wedding day.",
  ],

  verse:
    "Two are better than one; because they have a good reward for their labour.",
  verseRef: "Ecclesiastes 4:9",

  photos: [
    "images/1.jpg",
    "images/2.jpg",
    "images/3.jpg",
    "images/4.jpg",
    "images/5.jpg",
    "images/6.jpg",
  ],
};
/* ======================================== */

var $ = function (id) {
  return document.getElementById(id);
};

/* ---------- Fill the page ---------- */
document.title = C.groom + " & " + C.bride + " · Wedding";
$("hero").style.backgroundImage = "url('" + C.heroImage + "')";
$("albumSec").style.backgroundImage = "url('" + C.albumImage + "')";
$("g").textContent = C.groom;
$("b").textContent = C.bride;
$("when").textContent = C.dateText + " · " + C.timeText;
$("d1").textContent = C.dateText + ", " + C.timeText;
$("d2").textContent = C.venue + ", " + C.address;
$("map").href = C.mapUrl;
$("foot").textContent = C.groom + " & " + C.bride + " · " + C.dateText;

/* ---------- Story ---------- */
$("storyImg").src = C.storyPhoto;
$("storyImg").onerror = function () {
  this.style.display = "none";
};
C.story.forEach(function (text) {
  var p = document.createElement("p");
  p.textContent = text;
  $("storyText").append(p);
});

/* ---------- Verse ---------- */
if (C.verse) {
  $("verse").textContent = "“" + C.verse + "”";
  $("verseRef").textContent = C.verseRef;
} else {
  $("verseSec").hidden = true;
}

/* ---------- Countdown ---------- */
function tick() {
  var s = Math.max(0, Math.floor((new Date(C.date) - new Date()) / 1000));
  var parts = [
    ["days", s / 86400],
    ["hours", (s % 86400) / 3600],
    ["min", (s % 3600) / 60],
    ["sec", s % 60],
  ];
  $("cd").innerHTML = parts
    .map(function (p) {
      return "<div><b>" + Math.floor(p[1]) + "</b>" + p[0] + "</div>";
    })
    .join("");
}
tick();
setInterval(tick, 1000);

/* ---------- Slideshow: right to left, automatic ---------- */
var slide = 0;
var timer = null;

if (!C.photos.length) {
  $("gallerySec").hidden = true;
} else {
  C.photos.forEach(function (src, i) {
    var img = document.createElement("img");
    img.src = src;
    img.alt = "Photo " + (i + 1) + " of " + C.groom + " and " + C.bride;
    img.loading = i === 0 ? "eager" : "lazy";
    $("slides").append(img);

    var dot = document.createElement("span");
    dot.onclick = function () {
      go(i);
      auto();
    };
    $("dots").append(dot);
  });

  function go(i) {
    slide = (i + C.photos.length) % C.photos.length;
    $("slides").style.transform = "translateX(-" + slide * 100 + "%)";
    document.querySelectorAll("#dots span").forEach(function (d, j) {
      d.classList.toggle("on", j === slide);
    });
  }

  function auto() {
    clearInterval(timer);
    timer = setInterval(function () {
      go(slide - 1);
    }, 3000);
  }

  $("sPrev").onclick = function () {
    go(slide + 1);
    auto();
  };
  $("sNext").onclick = function () {
    go(slide - 1);
    auto();
  };

  go(0);
  auto();
}

/* ---------- Guest: load from the link (?g=ID) ---------- */
var guestId = new URLSearchParams(location.search).get("g");
var guestRef = null;

function noLink() {
  $("rsvp").hidden = true;
  $("rm").textContent = "Please open your personal invitation link to answer.";
}

async function loadGuest() {
  if (!guestId) {
    noLink();
    return;
  }
  try {
    guestRef = doc(db, "guests", guestId);
    var snap = await getDoc(guestRef);
    if (!snap.exists()) {
      noLink();
      return;
    }

    var g = snap.data();
    $("guest").textContent = "Dear " + g.name;

    if (typeof g.attending === "boolean") {
      document.querySelector(
        "input[name=a][value='" + (g.attending ? 1 : 0) + "']",
      ).checked = true;
      $("rg").value = g.count || 1;
      $("rw").value = g.wish || "";
      $("rm").textContent =
        "You already answered. You can change your answer below.";
    }
  } catch (err) {
    noLink();
  }
}
loadGuest();

/* ---------- Guest: send the answer ---------- */
$("rsvp").onsubmit = async function (e) {
  e.preventDefault();
  if (!guestRef) return;
  $("rm").textContent = "Sending...";
  try {
    await updateDoc(guestRef, {
      attending: document.querySelector("input[name=a]:checked").value === "1",
      count: Math.min(10, Math.max(1, parseInt($("rg").value) || 1)),
      wish: $("rw").value.trim().slice(0, 600),
      answeredAt: Date.now(),
    });
    $("rm").textContent = "Thank you! Your answer was sent to the couple.";
  } catch (err) {
    $("rm").textContent =
      "Could not send. Please check your internet and try again.";
  }
};

/* ---------- Photos and videos after the wedding ---------- */
if (new Date() >= new Date(C.date)) {
  $("uNote").textContent =
    "Thank you for celebrating with us! Please add your photos and short videos to our album.";
  $("uBtn").href = C.photosLink;
  $("uBtn").hidden = false;
} else {
  $("uNote").textContent =
    "This opens after the wedding. Come back then to share your photos and videos!";
}

/* ---------- Dark / light mode ---------- */
var root = document.documentElement;
var saved = localStorage.getItem("theme");
if (saved) root.setAttribute("data-theme", saved);
else if (matchMedia("(prefers-color-scheme:dark)").matches)
  root.setAttribute("data-theme", "dark");

$("themeBtn").onclick = function () {
  var dark = root.getAttribute("data-theme") === "dark";
  root.setAttribute("data-theme", dark ? "light" : "dark");
  localStorage.setItem("theme", dark ? "light" : "dark");
};
