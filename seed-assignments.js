
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
        console.log("🚀 Starting Enhanced Assignment Seeding with Explanations...");

        // 1. Delete all existing assignments
        const assignmentsSnapshot = await getDocs(collection(db, "assignments"));
        console.log(`🗑️ Deleting ${assignmentsSnapshot.size} existing assignments...`);
        for (const d of assignmentsSnapshot.docs) {
            await deleteDoc(doc(db, "assignments", d.id));
        }

        const assignmentsData = [
            {
                title: "واجب أساسيات HTML المطور",
                description: "قم بحل الأسئلة التالية لاختبار فهمك لهيكل صفحات الويب بعمق.",
                totalPoints: 15,
                isActive: true,
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                questions: [
                    {
                        id: "q1",
                        text: "ماذا يرمز اختصار HTML؟",
                        type: "mcq",
                        options: ["Hyper Text Markup Language", "High Text Machine Language", "Hyper Tabular Machine Language"],
                        correct: "Hyper Text Markup Language",
                        points: 5,
                        explanation: "HTML هي اللغة القياسية لإنشاء صفحات الويب، وترمز الكلمات إلى لغة توصيف النص الفائق."
                    },
                    {
                        id: "q2",
                        text: "أي عنصر يستخدم لأكبر عنوان؟",
                        type: "mcq",
                        options: ["<h6>", "<h1>", "<head>"],
                        correct: "<h1>",
                        points: 5,
                        explanation: "العناصر من h1 إلى h6 تستخدم للعناوين، حيث يمثل h1 العنوان الأهم والأكبر حجماً."
                    },
                    {
                        id: "q3",
                        text: "هل عنصر <br> يحتاج لوسم إغلاق؟",
                        type: "true_false",
                        options: ["نعم", "لا"],
                        correct: "لا",
                        points: 5,
                        explanation: "عنصر <br> هو عنصر فارغ (Empty Element)، مما يعني أنه لا يحتوي على محتوى وبالتالي لا يحتاج لوسم إغلاق."
                    }
                ]
            },
            {
                title: "محترف CSS Flexbox",
                description: "تعمق في التخطيطات المرنة وكيفية التحكم في تموضع العناصر.",
                totalPoints: 20,
                isActive: true,
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                questions: [
                    {
                        id: "q1",
                        text: "ما هي الخاصية التي تحدد اتجاه العناصر في Flexbox؟",
                        type: "mcq",
                        options: ["flex-direction", "justify-content", "align-items"],
                        correct: "flex-direction",
                        points: 10,
                        explanation: "تسمح لك خاصية flex-direction بتحديد ما إذا كانت العناصر ستترتب أفقياً (row) أو رأسياً (column)."
                    },
                    {
                        id: "q2",
                        text: "هل justify-content تعمل على المحور الرئيسي؟",
                        type: "true_false",
                        options: ["نعم", "لا"],
                        correct: "نعم",
                        points: 10,
                        explanation: "بشكل افتراضي، تقوم justify-content بتوزيع المساحة بين العناصر على طول المحور الرئيسي (الذي يحدده flex-direction)."
                    }
                ]
            }
        ];

        for (const asm of assignmentsData) {
            await addDoc(collection(db, "assignments"), {
                ...asm,
                createdAt: serverTimestamp()
            });
        }

        console.log("✅ New Assignments with explanations seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error Seed: ", error);
        process.exit(1);
    }
};

seedAssignments();
