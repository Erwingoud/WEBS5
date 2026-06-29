import {
  Queues,
  sendToQueue,
  type TargetExpiredEvent,
  type TargetRemindEvent,
} from "@photo-prestiges/common";
import { env } from "./env";
import { Schedule, type ScheduleDocument } from "./database";

const activeTimers = new Map<string, NodeJS.Timeout>();

export function handleSchedule(schedule: ScheduleDocument): void {
  clearExistingTimer(schedule.targetId);

  async function tick(): Promise<void> {
    const freshSchedule = await Schedule.findOne({
      targetId: schedule.targetId,
    });

    if (!freshSchedule) {
      clearExistingTimer(schedule.targetId);
      return;
    }

    const now = new Date();
    const remainingMs = freshSchedule.endTime.getTime() - now.getTime();

    if (remainingMs <= 0) {
      const event: TargetExpiredEvent = {
        id: freshSchedule.targetId,
      };

      await sendToQueue(env.rabbitmqUrl, Queues.targetExpired, event);

      await Schedule.deleteOne({
        _id: freshSchedule._id,
      });

      clearExistingTimer(freshSchedule.targetId);

      console.log(`Target expired: ${freshSchedule.targetId}`);
      return;
    }

    const event: TargetRemindEvent = {
      id: freshSchedule.targetId,
    };

    await sendToQueue(env.rabbitmqUrl, Queues.targetRemind, event);

    freshSchedule.lastReminderAt = now;
    await freshSchedule.save();

    console.log(`Reminder requested for target: ${freshSchedule.targetId}`);

    const nextDelay = Math.min(remainingMs, env.mailUpdateFrequencyMs);

    const timer = setTimeout(() => {
      tick().catch((error) => {
        console.error(
          `Clock tick failed for target ${freshSchedule.targetId}:`,
          error,
        );
      });
    }, nextDelay);

    activeTimers.set(freshSchedule.targetId, timer);
  }

  tick().catch((error) => {
    console.error(
      `Could not start schedule for target ${schedule.targetId}:`,
      error,
    );
  });
}

function clearExistingTimer(targetId: string): void {
  const existingTimer = activeTimers.get(targetId);

  if (existingTimer) {
    clearTimeout(existingTimer);
    activeTimers.delete(targetId);
  }
}
