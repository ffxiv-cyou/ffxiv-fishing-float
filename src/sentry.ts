import * as Sentry from "@sentry/svelte";
import { nanoid } from "nanoid";

Sentry.init({
    dsn: "https://8e85b591a0384248a6628949940a351e@sentry.ffxiv.cyou/6",
    sendDefaultPii: true,
    // enabled: import.meta.env.PROD,
});

const instanceID = nanoid();
Sentry.setExtra("instance_id", instanceID);
Sentry.setExtra("start_time", Date.now());

let deviceID = localStorage.getItem("fishing_float_did");
if (!deviceID) {
    deviceID = nanoid();
    localStorage.setItem("fishing_float_did", deviceID);
}
Sentry.setExtra("device_id", deviceID);
