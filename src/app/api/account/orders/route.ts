import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByUserId } from '../../../../lib/orderStore';
import { getSession } from '../../../../lib/session';
import { COOKIE_NAME } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const orders = getOrdersByUserId(session.userId);

  return NextResponse.json({
    success: true,
    orders
  });
}
