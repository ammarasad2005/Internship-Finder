import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/features/notifications/services/NotificationService';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Webhook Secret
    const secret = process.env.SUPABASE_WEBHOOK_SECRET;
    const receivedHeader = req.headers.get('x-webhook-secret');
    
    if (!secret) {
      console.error('SUPABASE_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (receivedHeader !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Payload
    const payload = await req.json();

    // Ensure it's an update to search_sessions
    if (payload.type !== 'UPDATE' || payload.table !== 'search_sessions') {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const { record } = payload;
    
    if (!record || !record.id || !record.profile_id) {
      return NextResponse.json({ error: 'Missing required session data' }, { status: 400 });
    }

    // Only process if status is completed
    if (record.status !== 'completed') {
      return NextResponse.json({ message: 'Session not completed, skipping' }, { status: 200 });
    }

    // 3. Process Notification
    const notificationService = new NotificationService();
    const result = await notificationService.sendSessionSummaryEmail(record.id, record.profile_id);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
