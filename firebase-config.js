import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Paste YOUR values from the Firebase console here
const firebaseConfig = {
  apiKey: "AIzaSyBHYf9y2h0R3Qp3kmwdxGgs6oySyUzRTqY",
  authDomain: "sam-mahi.firebaseapp.com",
  projectId: "sam-mahi",
  storageBucket: "sam-mahi.firebasestorage.app",
  messagingSenderId: "802320412425",
  appId: "1:802320412425:web:619c9bd7be1b54766e6dd8",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
