// Replies from polling, SSE and writes can arrive in a different order.
export function mergeState(previous, incoming) {
  if (!incoming?.group || incoming.unchanged) return previous;
  if (previous?.group?.id === incoming.group.id) {
    if (incoming.group.rev < previous.group.rev) return previous;
    if (incoming.group.rev === previous.group.rev && incoming.serverTime < previous.serverTime) return previous;
  }
  return incoming;
}
