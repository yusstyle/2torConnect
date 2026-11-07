/**
 * WhatsApp integration helpers for 2torConnect
 * Generates direct wa.me share & notification links for university WhatsApp groups
 */

export function getWhatsAppUrl(text: string, phone?: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
  const encoded = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function shareGroupSessionToWhatsApp(session: {
  id: number;
  subject: string;
  tutorName: string;
  scheduledAt: string;
  amount?: string | number | null;
  maxStudents?: number;
  joinedCount?: number;
}): void {
  const dateStr = new Date(session.scheduledAt).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const price = Number(session.amount || 0) > 0 ? `₦${Number(session.amount).toLocaleString()}` : "FREE";
  const spotsLeft = session.maxStudents && session.joinedCount !== undefined
    ? Math.max(0, session.maxStudents - session.joinedCount)
    : null;

  const spotsText = spotsLeft !== null ? `\n🔥 Only *${spotsLeft} seats remaining!*` : "";

  const message =
    `🎓 *2torConnect Group Revision Class*\n\n` +
    `📚 *Course/Topic:* ${session.subject}\n` +
    `👨‍🏫 *Tutor:* ${session.tutorName}\n` +
    `⏰ *Date & Time:* ${dateStr}\n` +
    `💳 *Fee:* ${price}${spotsText}\n\n` +
    `👇 *Join the live class & reserve your seat here:*\n` +
    `https://www.2torconnect.com/group-sessions\n\n` +
    `_Powered by 2torConnect — Nigeria's #1 University Peer Learning Network_`;

  window.open(getWhatsAppUrl(message), "_blank");
}

export function sharePastQuestionsToWhatsApp(courseCode: string, courseTitle: string): void {
  const message =
    `📖 *University Past Questions & CBT Mock Exam*\n\n` +
    `🎯 *Course:* ${courseCode} — ${courseTitle}\n` +
    `✅ Solved past exam questions with step-by-step answers\n` +
    `⏱️ Practice with timed CBT mock quizzes and get your score instantly!\n\n` +
    `👇 *Practice online for free on 2torConnect:*\n` +
    `https://www.2torconnect.com/past-questions\n\n` +
    `_Share with your course group & department classmates!_`;

  window.open(getWhatsAppUrl(message), "_blank");
}

export function pingSessionWhatsApp(params: {
  partnerName: string;
  partnerPhone?: string;
  subject: string;
  time: string;
  sessionId: number;
  isTutor: boolean;
}): void {
  const roleName = params.isTutor ? "your tutor" : "your student";
  const message =
    `👋 Hello ${params.partnerName}!\n\n` +
    `This is a reminder for our *${params.subject}* tutoring session on 2torConnect.\n` +
    `⏰ *Time:* ${params.time}\n\n` +
    `🎥 *Join live call directly here:*\n` +
    `https://www.2torconnect.com/session/${params.sessionId}\n\n` +
    `See you in class!`;

  window.open(getWhatsAppUrl(message, params.partnerPhone), "_blank");
}
