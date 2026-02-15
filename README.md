# 🎓 Efham (افهم) - Learning Management System

**Efham** is a streamlined LMS platform designed to manage a single subject efficiently. It bridges the gap between teachers and students by providing a centralized hub for assignments, quizzes, and performance tracking.

---

## 🚀 Project Overview
The goal of **Efham** is to simplify the educational workflow. Teachers can focus on delivering content and grading, while students get a clear roadmap of their tasks and progress in a distraction-free environment.

---

## ✨ Core Features (MVP)

### 👨‍🏫 Teacher Dashboard
* **Student Management:** Add, view, and track enrolled students.
* **Assignment Hub:** Create assignments with descriptions and deadlines.
* **Quiz Builder:** Design simple quizzes to test student knowledge.
* **Gradebook:** Manually input and manage grades for all submissions.
* **Class Overview:** A bird's-eye view of all student activities.

### 👨‍🎓 Student Dashboard
* **Course Content:** Access all materials and instructions uploaded by the teacher.
* **Assignment Submission:** Solve and upload assignments directly through the portal.
* **Active Quizzes:** Participate in quizzes and see immediate results.
* **Performance Tracking:** A dedicated "My Grades" section to monitor progress.

---

## 🛠️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js, Tailwind CSS, ShadCN |
| **Backend** | Firebase |
| **Database** | Firestore |
| **Authentication** | Firebase |
| **State Management** | Zustand |

---

## 📂 Database Architecture (Schema)
The platform is built on a relational/document structure:
* **Users:** Handles Authentication & Roles (Teacher/Student).
* **Assignments:** Stores task details and deadlines.
* **Submissions:** Links student answers to specific assignments.
* **Quizzes & Questions:** Stores test structures and correct answers.
* **Grades:** A unified record for all evaluation results.

---

## 🏗️ Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/mohdragon010/efham.git](https://github.com/mohdragon010/efham.git)
 
    ```
2.  **Client Setup (Frontend):**
    ```bash
    cd frontend
    npm install
    npm start
    ```

---

## 📈 Future Roadmap
- [ ] **Auto-Grading:** Instant correction for MCQ-based quizzes.
- [ ] **Analytics:** Interactive charts to visualize student performance trends.
- [ ] **Notifications:** Real-time alerts for new assignments or graded tasks.
- [ ] **Attendance:** A digital register for student presence.

---

## 📧 Contact
Developed by **[Mohamed Ayman]** – Let's build something great together!
[https://mohamed-crafts.vercel.app](Visit my portfolio)
