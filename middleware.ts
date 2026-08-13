import { NextResponse } from 'next/server';

export function middleware() {
  // يخبر السيرفر بمرور الطلب بسلام دون أي توجيه إجباري
  return NextResponse.next();
}

export const config = {
  // نترك الماتشر فارغاً لكي لا يطبق على أي صفحة برمجية حالياً
  matcher: [],
};