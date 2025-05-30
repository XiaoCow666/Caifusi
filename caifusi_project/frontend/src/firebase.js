// src/firebase.js

// 1. 从 SDK 中导入你需要的函数
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // 导入 Firebase Authentication
import { getFirestore } from "firebase/firestore"; // 导入 Firestore 数据库
// import { getAnalytics } from "firebase/analytics"; // 如果你需要分析功能，也取消注释这一行

// 2. 你的 Web 应用的 Firebase 配置 (从你的图片中获取)
// 重要：请确保这些值与你在 Firebase 控制台中看到的一致
const firebaseConfig = {
  apiKey: "AIzaSyCX-PVrbMht7JMVuTqK1Mo126sg7h3Qh3g", // 这是示例，请使用你图片中的真实值
  authDomain: "caifusi.firebaseapp.com",
  projectId: "caifusi",
  storageBucket: "caifusi.firebasestorage.app",
  messagingSenderId: "739790071042",
  appId: "1:739790071042:web:2b08642ba1827e02b750e1b",
  measurementId: "G-GQMDX13B3R"
};

// 3. 初始化 Firebase 应用
const app = initializeApp(firebaseConfig);

// 4. 初始化并导出你需要的 Firebase 服务实例
const auth = getAuth(app); // 获取 Authentication 服务实例
const db = getFirestore(app); // 获取 Firestore 服务实例
// const analytics = getAnalytics(app); // 如果你需要分析功能

// 5. 导出服务实例，以便在应用的其他部分使用
export { app, auth, db /*, analytics */ };