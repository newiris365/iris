import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { supabaseAdmin } from '../config/supabase';

let firebaseApp: App | null = null;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[FCM SERVICE] Firebase Admin initialized.');
  } else {
    console.log('[FCM SERVICE] Firebase credentials missing. Running in mock-delivery fallback mode.');
  }
} catch (err) {
  console.error('[FCM SERVICE] Initialization error:', err);
}

/**
 * Sends a push notification to all active devices registered for the given user.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<boolean> {
  try {
    // Fetch all active device tokens for the user
    const { data: tokens, error } = await supabaseAdmin
      .from('device_tokens')
      .select('device_token')
      .eq('user_id', userId);

    if (error || !tokens || tokens.length === 0) {
      console.log(`[FCM SERVICE MOCK] No device tokens registered for user ${userId}. Skipping push notification.`);
      return false;
    }

    const deviceTokens = tokens.map(t => t.device_token);

    if (firebaseApp) {
      const messaging = getMessaging(firebaseApp);
      const response = await messaging.sendEachForMulticast({
        tokens: deviceTokens,
        notification: { title, body },
        data
      });
      
      console.log(`[FCM SERVICE] Push notification sent to user ${userId}. Success: ${response.successCount}, Failure: ${response.failureCount}`);
      
      // Clean up invalid/expired tokens
      if (response.failureCount > 0) {
        const tokensToDelete: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered'
            ) {
              tokensToDelete.push(deviceTokens[idx]);
            }
          }
        });
        
        if (tokensToDelete.length > 0) {
          await supabaseAdmin
            .from('device_tokens')
            .delete()
            .in('device_token', tokensToDelete);
          console.log(`[FCM SERVICE] Cleaned up ${tokensToDelete.length} stale/invalid tokens.`);
        }
      }
      return true;
    } else {
      // Mock push notification delivery
      console.log(`[FCM SERVICE MOCK] Sending push to user ${userId} on tokens: ${JSON.stringify(deviceTokens)}`);
      console.log(`[FCM SERVICE MOCK] Title: "${title}" | Body: "${body}" | Data:`, data);
      return true;
    }
  } catch (err) {
    console.error('[FCM SERVICE] Error sending push notification:', err);
    return false;
  }
}
