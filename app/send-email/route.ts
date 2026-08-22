import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'البريد الإلكتروني والرمز مطلوبان.' }, { status: 400 });
    }

    // 1️⃣ إعداد محرك الإرسال عبر سيرفرات جوجل المؤمنة
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // بريدك من ملف الـ .env
        pass: process.env.EMAIL_PASS, // كلمة مرور التطبيقات من ملف الـ .env
      },
    });

    // 2️⃣ قالب HTML فخم جداً بهوية بصرية تليق بجامعة إب
    const emailHtml = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff;">
        
        <!-- الهيدر الأكاديمي -->
        <div style="background: linear-gradient(135deg, #0A2540 0%, #0E3354 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">بوابة جامعة إب الإلكترونية</h2>
          <p style="color: #cbd5e1; margin: 5px 0 0 0; font-size: 12px; font-weight: bold;">منصة الخدمات الأكاديمية الذكية</p>
        </div>

        <!-- محتوى الرسالة -->
        <div style="padding: 30px 25px; text-align: right; color: #334155;">
          <p style="font-size: 15px; line-height: 1.6; margin-top: 0; font-weight: bold;">مرحباً بك يا هندسة في رحاب جامعتك،</p>
          <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
            لقد بدأت للتو خطوة التحقق من هويتك لتأسيس حسابك الأكاديمي الجديد على المنصة. يرجى استخدام رمز التفعيل السري المرفق أدناه لإكمال استمارة التسجيل الرسمية:
          </p>

          <!-- صندوق الرمز السري الفخم -->
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 900; margin-bottom: 8px;">رمز التحقق الموحد (OTP)</span>
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; color: #0A2540; letter-spacing: 6px; display: inline-block;">${code}</span>
          </div>

          <p style="font-size: 11px; color: #ef4444; font-weight: bold; text-align: center; margin-bottom: 0;">
            ⚠️ ملاحظة أمنية: هذا الرمز سري وصالح للاستخدام لمرة واحدة فقط ولمدة 10 دقائق. لا تشاركه مع أي شخص لضمان حماية بياناتك الأكاديمية.
          </p>
        </div>

        <!-- الفوتر السفلي للجامعة -->
        <div style="background-color: #f1f5f9; padding: 15px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: bold;">
            منصة جامعة إب الذكية © 2026 - جميع الحقوق محفوظة لقطاع شؤون الطلاب والكنترول المركزي
          </p>
        </div>
      </div>
    `;

    // 3️⃣ تفاصيل رسالة الإرسال
    const mailOptions = {
      from: `"بوابة جامعة إب الذكية" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔑 رمز التحقق لمرة واحدة [${code}] - جامعة إب`,
      html: emailHtml,
    };

    // 4️⃣ تشغيل بث البريد الحقيقي سحابياً
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('🚨 عطل في سيرفر إرسال الإيميل:', error.message);
    return NextResponse.json({ error: 'فشل ترحيل كود التحقق للبريد المطلوب' }, { status: 500 });
  }
}