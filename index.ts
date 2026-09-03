import 'expo-router/entry';

console.log("[Startup] index.ts: Entry point loaded");

const heartbeat = setInterval(() => {
  console.log("[Startup] Heartbeat: app is alive");
}, 3000);

try {
  const Updates = require('expo-updates');
  Updates.addStatusUpdateListener((status: any) => {
    console.log("[Startup] Updates status:", JSON.stringify(status));
  });
  console.log("[Startup] expo-updates available, current status:", Updates.status);
} catch (e) {
  console.log("[Startup] expo-updates not available:", e instanceof Error ? e.message : String(e));
}

const defaultHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error("[GlobalError]", isFatal ? "FATAL" : "non-fatal", error.message);
  if (error.stack) {
    console.error("[GlobalError] Stack:", error.stack.split('\n').slice(0, 5).join('\n'));
  }
  defaultHandler(error, isFatal);
});

setTimeout(() => {
  console.log("[Startup] index.ts: Bundle fully loaded and running");
  clearInterval(heartbeat);
}, 5000);
