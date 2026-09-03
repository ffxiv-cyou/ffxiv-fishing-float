import * as Sentry from "@sentry/svelte";
import { nanoid } from "nanoid";

export interface LastErrorInfo {
  id: string;
  message: string;
  time: number;
}

const RECENT_ERROR_MS = 10 * 60 * 1000;

let lastError: LastErrorInfo | undefined;

function extractMessage(event: Sentry.ErrorEvent): string {
  const exc = event.exception?.values?.[0];
  if (exc) return exc.value || exc.type || "";
  if (event.message) return event.message;
  return "";
}

export function getRecentError(now = Date.now()): LastErrorInfo | undefined {
  if (lastError && now - lastError.time <= RECENT_ERROR_MS) return lastError;
  return undefined;
}

Sentry.init({
  dsn: "https://8e85b591a0384248a6628949940a351e@sentry.ffxiv.cyou/6",
  sendDefaultPii: true,
  // enabled: import.meta.env.PROD,
  beforeSend: (event) => {
    if (event.type === undefined && event.event_id) {
      lastError = {
        id: event.event_id,
        message: extractMessage(event),
        time: Date.now(),
      };
    }
    return event;
  },
});

const instanceID = nanoid();
Sentry.setContext("start_time", { unix: Date.now(), iso: new Date().toISOString() });

let deviceID = localStorage.getItem("fishing_float_did");
if (!deviceID) {
    deviceID = nanoid();
    localStorage.setItem("fishing_float_did", deviceID);
}
Sentry.setContext("id", {
    deviceID,
    instanceID,
});
