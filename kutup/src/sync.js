// Replies from polling, SSE and writes can arrive in a different order.
// A team change only comes with a fresh opening (setData), never through here:
// a poll started for the cached picture of another account on this phone can
// answer with the account the cookie now holds, and would leave the app with
// no "me" in the team it shows.
export function mergeState(previous, incoming) {
  if (!incoming?.group || incoming.unchanged) return previous;
  if (previous?.group?.id && previous.group.id !== incoming.group.id) return previous;
  if (previous?.group?.id === incoming.group.id) {
    if (incoming.group.rev < previous.group.rev) return previous;
    if (incoming.group.rev === previous.group.rev && incoming.serverTime < previous.serverTime) return previous;
  }
  return incoming;
}
