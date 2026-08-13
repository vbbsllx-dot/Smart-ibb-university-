import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend('re_YOUR_API_KEY_HERE'); // ضع مفتاحك هنا

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    
    await resend.emails.send({
      from: 'onboarding@resend.dev', // يمكنك تعديلها في حسابك بـ Resend
      to: email,
      subject: 'رمز التحقق - بوابة جامعة إب',
      html: `<div dir="rtl">
               <h3>مرحباً بك في بوابة جامعة إب الذكية</h3>
               <p>رمز التحقق الخاص بك هو: <strong>${code}</strong></p>
               <p>يرجى إدخال هذا الرمز في الموقع لإكمال عملية التسجيل.</p>
             </div>`
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'فشل الإرسال' }, { status: 500 });
  }
}