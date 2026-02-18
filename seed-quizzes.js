
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyAjEK_VE8UWchejb_t7RtfnS7agGf2N-OY",
    authDomain: "efham-b7776.firebaseapp.com",
    projectId: "efham-b7776",
    storageBucket: "efham-b7776.firebasestorage.app",
    messagingSenderId: "507090246189",
    appId: "1:507090246189:web:1738689b1d4632639a76a4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedQuizzes = async () => {
    try {
        console.log("🚀 Starting Extended Quiz Seeding...");

        // 1. Delete all existing quizzes
        const quizzesSnapshot = await getDocs(collection(db, "quizzes"));
        console.log(`🗑️ Deleting ${quizzesSnapshot.size} existing quizzes...`);
        for (const d of quizzesSnapshot.docs) {
            await deleteDoc(doc(db, "quizzes", d.id));
        }

        const quizTitles = [
            "اختبار السرعة HTML", "تحدي CSS", "منطق الـ Algorithms",
            "اختبار الـ ES6", "تحدي الـ Array Methods", "اختبار الـ Async/Await",
            "تحدي الـ React Hooks", "اختبار الـ Routing", "منطق الـ CRUD", "الاختبار الشامل"
        ];

        for (let i = 0; i < 10; i++) {
            await addDoc(collection(db, "quizzes"), {
                title: quizTitles[i],
                description: `اختبار سريع لقياس مستواك في ${quizTitles[i]}. ركز جيداً قبل البدء.`,
                totalPoints: 30,
                duration: 15,
                isActive: true,
                questions: [
                    { id: "q1", text: "سؤال ذكاء سريع؟", type: "mcq", options: ["إجابة 1", "إجابة 2", "إجابة 3"], correct: "إجابة 1", points: 15, explanation: "توضيح سريع للإجابة." },
                    { id: "q2", text: "سؤال منطقي؟", type: "true_false", options: ["صح", "خطأ"], correct: "صح", points: 15, explanation: "توضيح منطقي للإجابة." }
                ],
                createdAt: serverTimestamp()
            });
        }

        console.log("✅ 10 Quizzes seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error Seed: ", error);
        process.exit(1);
    }
};

seedQuizzes();
