import type {
  TargetMailFinalReportEvent,
  TargetMailReminderEvent,
  TargetMailScoreEvent,
  UserCreatedEvent,
} from "@photo-prestiges/common";
import {
  sendFinalReport,
  sendPostGameScore,
  sendRegistrationMail,
  sendReminder,
} from "./mailService";

export async function userCreatedHandler(
  message: UserCreatedEvent,
): Promise<void> {
  if (!message.email || !message.password || !message.username) {
    throw new Error("Invalid user.created message");
  }

  await sendRegistrationMail(message);

  console.log(`Sent registration mail to ${message.email}`);
}

export async function finalReportHandler(
  message: TargetMailFinalReportEvent,
): Promise<void> {
  if (!message.title || !message.email || !Array.isArray(message.uploads)) {
    throw new Error("Invalid target.mail.finalReport message");
  }

  await sendFinalReport(message.title, message.uploads, message.email);

  console.log(`Sent final report mail to ${message.email}`);
}

export async function scoreHandler(
  message: TargetMailScoreEvent,
): Promise<void> {
  if (!message.title || !message.email || typeof message.score !== "number") {
    throw new Error("Invalid target.mail.score message");
  }

  await sendPostGameScore(message.title, message.score, message.email);

  console.log(`Sent score mail to ${message.email}`);
}

export async function reminderHandler(
  message: TargetMailReminderEvent,
): Promise<void> {
  if (!message.title || !message.email || !message.endDate) {
    throw new Error("Invalid target.mail.reminder message");
  }

  await sendReminder(message.title, message.endDate, message.email);

  console.log(`Sent reminder mail to ${message.email}`);
}
