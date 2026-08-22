/**
 * جسر التواصل بين منصة إب الذكية وسيرفر الوكيل الذكي (FastAPI)
 */
const AI_SERVER_URL = "http://127.0.0.1:8000"; // رابط السيرفر المحلي أو السحابي

const IbbAIBridge = {
    // 1. تسجيل الدخول الموحد (SSO) واستخراج التوكن
    async ssoLogin(studentData) {
        try {
            const response = await fetch(`${AI_SERVER_URL}/api/v1/integration/auth/sso`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: studentData.id,
                    name: studentData.name,
                    email: studentData.email,
                    department: studentData.department || "Electrical Engineering"
                })
            });

            if (!response.ok) throw new Error("فشل الاتصال بسيرفر الذكاء الاصطناعي");

            const data = await response.json();
            // حفظ التوكن في ذاكرة المتصفح للجلسة
            localStorage.setItem("ai_access_token", data.access_token);
            console.log("تمت مصادقة الطالب مع نظام الذكاء الاصطناعي بنجاح.");
            return data;
        } catch (error) {
            console.error("خطأ في SSO:", error);
        }
    },

    // 2. إرسال استفسار للوكيل الذكي واستقبال الرد
    async sendQuery(queryText, subjectId = null) {
        const token = localStorage.getItem("ai_access_token");
        if (!token) {
            console.error("لم يتم تسجيل الدخول، يرجى استدعاء ssoLogin أولاً.");
            return;
        }

        try {
            const response = await fetch(`${AI_SERVER_URL}/api/v1/integration/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: queryText,
                    subject_id: subjectId,
                    thread_id: `student_session_${localStorage.getItem("ai_student_id") || "default"}`
                })
            });

            if (!response.ok) throw new Error("حدث خطأ أثناء معالجة الطلب.");

            const result = await response.json();
            return result; // يحتوي على الرد (response) والمصادر (sources)
        } catch (error) {
            console.error("خطأ أثناء المحادثة:", error);
            return { response: "عذراً، تعذر الاتصال بالوكيل الذكي حالياً." };
        }
    },

    // 3. رفع المنهج وتكشيفه (RAG Sync)
    async syncCurriculum(fileInput, subjectId) {
        const token = localStorage.getItem("ai_access_token");
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("subject_id", subjectId);

        try {
            const response = await fetch(`${AI_SERVER_URL}/api/v1/integration/curriculum/sync`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error("خطأ في رفع المنهج:", error);
        }
    }
};