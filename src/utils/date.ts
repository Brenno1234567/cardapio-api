export function nowIso() {
  return new Date().toISOString();
}

export function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

