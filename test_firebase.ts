import { db } from './firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';

async function testConnection() {
  console.log("🔄 Đang kết nối tới Firestore...");
  try {
    // 1. Thử ghi dữ liệu
    const docRef = await addDoc(collection(db, "test_collection"), {
      message: "Hello from Smart Accounting App!",
      timestamp: new Date(),
      user: "Admin Huy"
    });
    console.log("✅ Ghi thành công! Document ID:", docRef.id);

    // 2. Thử đọc lại dữ liệu vừa ghi
    console.log("🔄 Đang đọc lại dữ liệu...");
    const querySnapshot = await getDocs(collection(db, "test_collection"));
    
    console.log("\n--- DỮ LIỆU TRÊN CLOUD ---");
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} =>`, doc.data());
    });
    console.log("--------------------------\n");
    console.log("🎉 CHÚC MỪNG! App đã kết nối thành công với Firestore.");

  } catch (e) {
    console.error("❌ Lỗi kết nối:", e);
  }
}

testConnection();
