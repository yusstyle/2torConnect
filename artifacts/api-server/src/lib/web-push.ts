import { sendNotification, setVapidDetails } from "web-push";
import { db } from "@workspace/db";
import { pushSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || "";
}

export function isWebPushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

export async function sendWebPushNotification(userId: number, title: string, message: string, link?: string) {
  if (!isWebPushConfigured()) return;
  const subscriptions = await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userId, userId));
  if (!subscriptions.length) return;

  setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, JSON.stringify({ title, body: message, link: link || "/", icon: "/icon-192.png" }));
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, subscription.id));
      }
    }
  }));
}
