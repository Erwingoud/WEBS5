export const Queues = {
  userCreated: "user.created",

  targetCreated: "target.created",
  targetExpired: "target.expired",
  targetRemind: "target.remind",

  scoreRequest: "score.request",
  scoreReady: "score.ready",

  targetMailFinalReport: "target.mail.finalReport",
  targetMailScore: "target.mail.score",
  targetMailReminder: "target.mail.reminder",
} as const;

export interface UserCreatedEvent {
  email: string;
  username: string;
  password: string;
  role: "owner" | "participant";
}

export interface ImageClassifier {
  tag: string;
  confidence: number;
}

export interface TargetCreatedEvent {
  id: string;
  deadline: string;
}

export interface TargetExpiredEvent {
  id: string;
}

export interface TargetRemindEvent {
  id: string;
}

export interface ScoreRequestEvent {
  targetId: string;
  username: string;
  deadline: string;
  targetTags: ImageClassifier[];
  submissionTags: ImageClassifier[];
  startTime: string;
}

export interface ScoreReadyEvent {
  targetId: string;
  username: string;
  score: number;
}

export interface TargetMailScoreEvent {
  title: string;
  score: number;
  email: string;
}

export interface TargetMailReminderEvent {
  title: string;
  endDate: string;
  email: string;
}

export interface TargetUploadScore {
  username: string;
  score: number;
  submittedAt?: string;
}

export interface TargetMailFinalReportEvent {
  title: string;
  uploads: TargetUploadScore[];
  email: string;
}
