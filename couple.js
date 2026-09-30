import { db, auth } from "./firebase-config.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// After hosting, put your site address here, for example "https://our-wedding.netlify.app/"
const SITE_URL = "";

const $ = (id) => document.getElementById(id);
let guests = [];
let unsubscribe = null;

function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
function btn(label, fn, cls) {
  const b = el("button", label, cls || "small");
  b.type = "button";
  b.onclick = fn;
  return b;
}
function say(text) {
  $("msg").textContent = text;
}
function copy(text) {
  return navigator.clipboard.writeText(text);
}

function linkFor(g) {
  const base = SITE_URL || location.href.replace(/couple\.html.*$/, "");
  return base + "index.html?g=" + g.id;
}

onAuthStateChanged(auth, (user) => {
  $("login").hidden = !!user;
  $("app").hidden = !user;
  if (user && !unsubscribe) start();
  if (!user && unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
});

$("login").onsubmit = (e) => {
  e.preventDefault();
  $("lm").textContent = "";
  signInWithEmailAndPassword(auth, $("em").value, $("pw").value).catch(() => {
    $("lm").textContent = "Wrong email or password.";
  });
};
$("out").onclick = () => signOut(auth);

function start() {
  const q = query(collection(db, "guests"), orderBy("createdAt"));
  unsubscribe = onSnapshot(
    q,
    (snap) => {
      guests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    },
    () => say("Could not load the guests. Check your Firestore rules."),
  );
}

$("add").onsubmit = (e) => {
  e.preventDefault();
  const name = $("gn")
    .value.trim()
    .replace(/^dear\s+/i, "");
  if (!name) return;
  addDoc(collection(db, "guests"), {
    name: name,
    attending: null,
    count: 1,
    wish: "",
    createdAt: Date.now(),
  })
    .then(() => {
      $("gn").value = "";
      say("Added " + name + ". Now send the invitation.");
    })
    .catch(() => say("Could not add the guest."));
};

function send(kind, g) {
  const link = linkFor(g);
  const text =
    "Dear " +
    g.name +
    ", you are invited to our wedding! Please open your invitation and tell us if you can come: " +
    link;

  if (kind === "wa") {
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  } else if (kind === "tg") {
    window.open(
      "https://t.me/share/url?url=" +
        encodeURIComponent(link) +
        "&text=" +
        encodeURIComponent(
          "Dear " + g.name + ", you are invited to our wedding!",
        ),
      "_blank",
    );
  } else if (kind === "ig") {
    if (navigator.share) {
      navigator.share({ text: text });
      return;
    }
    copy(text).then(() => {
      say("Copied! Paste it in an Instagram message.");
      window.open("https://www.instagram.com/direct/inbox/", "_blank");
    });
  } else {
    copy(link).then(() => say("Link copied for " + g.name + "."));
  }
}

function render() {
  const yes = guests.filter((g) => g.attending === true);
  const no = guests.filter((g) => g.attending === false);
  const waiting = guests.length - yes.length - no.length;
  const people = yes.reduce((sum, g) => sum + (g.count || 1), 0);

  $("stats").textContent = "";
  [
    [yes.length, "coming"],
    [people, "people coming"],
    [no.length, "not coming"],
    [waiting, "waiting"],
  ].forEach((s) => {
    const box = el("div");
    box.append(el("b", String(s[0])), el("span", s[1]));
    $("stats").append(box);
  });

  const list = $("list");
  list.textContent = "";
  if (!guests.length)
    list.append(el("p", "No guests yet. Add the first guest above."));

  guests.forEach((g) => {
    const card = el("div", null, "gcard");
    const head = el("div", null, "ghead");
    const status =
      g.attending === true
        ? ["Coming (" + (g.count || 1) + ")", "yes"]
        : g.attending === false
          ? ["Not coming", "no"]
          : ["Waiting", "wait"];
    head.append(
      el("strong", g.name),
      el("span", status[0], "badge " + status[1]),
    );
    card.append(head);

    if (g.wish) card.append(el("p", "“" + g.wish + "”", "wishtext"));

    const row = el("div", null, "row");
    row.append(
      btn("WhatsApp", () => send("wa", g)),
      btn("Telegram", () => send("tg", g)),
      btn("Instagram", () => send("ig", g)),
      btn("Copy link", () => send("cp", g), "small alt"),
      btn(
        "Delete",
        () => {
          if (confirm("Delete " + g.name + "?"))
            deleteDoc(doc(db, "guests", g.id));
        },
        "small alt",
      ),
    );
    card.append(row);
    list.append(card);
  });
}
