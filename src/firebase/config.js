import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnMFppydOZR8KLAvTocOJolzNnB27WEpo",
  authDomain: "xbook-4522b.firebaseapp.com",
  projectId: "xbook-4522b",
  storageBucket: "xbook-4522b.appspot.com",
  messagingSenderId: "929935981615",
  appId: "1:929935981615:web:df64f438fedfce52249ada",
  measurementId: "G-FLN982VNYM",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
