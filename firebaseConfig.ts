import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// TODO: Thay thế bằng thông tin từ Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
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
