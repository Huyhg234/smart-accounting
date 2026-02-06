import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// TODO: Thay thế bằng thông tin từ Firebase Console -> Project Settings
// Config lấy từ biến môi trường (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if the configuration is still using placeholders
export const isFirebaseConfigured = firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let app;
let db: Firestore;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase chưa được cấu hình. Ứng dụng sẽ chạy ở chế độ Offline (Mock Data).");
}

export { db };
