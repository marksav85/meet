export async function register() {
  if (!("serviceWorker" in navigator)) return;
  try {
    if (import.meta.env.DEV) {
      // Vite development must never be controlled by a previous local preview.
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.filter((r) => r.scope === new URL(import.meta.env.BASE_URL, location.origin).href).map((r) => r.unregister()));
      return;
    }
    // No automatic page reload: a worker update must not interrupt PKCE exchange.
    const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`, { updateViaCache: "none" });
    await registration.update();
  } catch {
    // Offline availability is optional; authentication and events still work.
  }
}
