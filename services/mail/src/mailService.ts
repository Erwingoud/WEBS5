import sendgrid from "@sendgrid/mail";
import type {
  TargetUploadScore,
  UserCreatedEvent,
} from "@photo-prestiges/common";
import { env } from "./env";

sendgrid.setApiKey(env.sendgridApiKey);

export interface RegistrationMail {
  email: string;
  username: string;
  password: string;
  role?: string;
}

export interface UploadScore {
  username: string;
  score: number;
  submittedAt?: string;
}

export async function sendRegistrationMail(
  accountDetails: UserCreatedEvent,
): Promise<void> {
  await sendgrid.send({
    to: accountDetails.email,
    from: env.mailFrom,
    subject: `Registratie Photo Prestiges: ${accountDetails.username}`,
    text:
      `Je account met de naam ${accountDetails.username} is gemaakt.\n\n` +
      `Rol: ${accountDetails.role ?? "onbekend"}\n` +
      `E-mail: ${accountDetails.email}\n` +
      `Wachtwoord: ${accountDetails.password}\n\n` +
      `Bewaar dit wachtwoord goed.`,
  });
}

export async function sendFinalReport(
  title: string,
  uploads: TargetUploadScore[],
  email: string,
): Promise<void> {
  const results = uploads.length
    ? uploads
        .sort((a, b) => b.score - a.score)
        .map((upload, index) => {
          const submittedAt = upload.submittedAt
            ? ` - ingezonden op ${new Date(upload.submittedAt).toLocaleString("nl-NL")}`
            : "";

          return `${index + 1}. ${upload.username}: ${upload.score}%${submittedAt}`;
        })
        .join("\n")
    : "-- geen inzendingen --";

  await sendgrid.send({
    to: email,
    from: env.mailFrom,
    subject: `Eindrapport target: ${title}`,
    text: `De uiteindelijke scores voor '${title}' zijn:\n\n${results}`,
  });
}

export async function sendPostGameScore(
  title: string,
  score: number,
  email: string,
): Promise<void> {
  await sendgrid.send({
    to: email,
    from: env.mailFrom,
    subject: `Je score voor: ${title}`,
    text: `Jouw score op de wedstrijd '${title}' is geworden: ${score}%.`,
  });
}

export async function sendReminder(
  title: string,
  endDate: string,
  email: string,
): Promise<void> {
  const formattedEndDate = new Date(endDate).toLocaleString("nl-NL");

  await sendgrid.send({
    to: email,
    from: env.mailFrom,
    subject: `Reminder: ${title}`,
    text:
      `Je hebt nog geen foto ingezonden voor '${title}'.\n\n` +
      `Je kunt nog meedoen tot: ${formattedEndDate}.\n\n` +
      `Vergeet niet om je foto op tijd te uploaden.`,
  });
}
