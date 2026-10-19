// Acknowledging/cancelling closes this device's matching notification, if supported.
export async function closeBuildNotice(memberId, ends) {
  try {
    const registration = await navigator.serviceWorker?.getRegistration?.();
    const list = await registration?.getNotifications?.({ tag: `relaxed-${memberId}-${ends}` });
    list?.forEach((notice) => notice.close());
  } catch {}
}
