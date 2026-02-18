
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

const seedAssignments = async () => {
    try {
        console.log("🚀 Starting Extended Assignment Seeding...");

        // 1. Delete all existing assignments
        const assignmentsSnapshot = await getDocs(collection(db, "assignments"));
        console.log(`🗑️ Deleting ${assignmentsSnapshot.size} existing assignments...`);
        for (const d of assignmentsSnapshot.docs) {
            await deleteDoc(doc(db, "assignments", d.id));
        }

        const topics = [
            "أساسيات HTML المنطقية", "تنسيقات CSS المتقدمة", "تخطيطات Flexbox و Grid",
            "أساسيات JavaScript", "التحكم في الـ DOM", "مقدمة في React",
            "مكونات UI الحديثة", "إدارة الحالة في التطبيقات", "التعامل مع APIs", "أساسيات قواعد البيانات"
        ];

        for (let i = 0; i < 10; i++) {
            const asm = {
                title: `واجب: ${topics[i]}`,
                description: `هذا الواجب يغطي المفاهيم الأساسية والمتقدمة في ${topics[i]}. يرجى الحل بدقة.`,
                totalPoints: 20,
                isActive: true,
                deadline: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
                questions: [
                    { id: "q1", text: "سؤال نظري حول المفهوم الأول؟", type: "mcq", options: ["خيار أ", "خيار ب", "خيار ج"], correct: "خيار أ", points: 10, explanation: "توضيح تعليمي لهذا السؤال." },
                    { id: "q2", text: "سؤال عملي حول التطبيق؟", type: "mcq", options: ["خيار 1", "خيار 2", "خيار 3"], correct: "خيار 1", points: 10, explanation: "توضيح تعليمي لهذا السؤال." }
                ],
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, "assignments"), asm);
        }

        console.log("✅ 10 Assignments seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error Seed: ", error);
        process.exit(1);
    }
};

seedAssignments();
