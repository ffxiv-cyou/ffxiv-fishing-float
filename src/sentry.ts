import * as Sentry from "@sentry/svelte";

Sentry.init({
    dsn: "https://8e85b591a0384248a6628949940a351e@sentry.ffxiv.cyou/6",
    sendDefaultPii: true,
    enabled: import.meta.env.PROD,
});
