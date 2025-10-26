type ServiceType = "last_redis" | "last_socket" | "last_check";

type ServiceEntry = {
  name: string;
  type: ServiceType;
  date: string;
};

export default function checkServiceStatusFast(
  data: ServiceEntry[]
): Record<string, boolean> {
  const now = Date.now();
  const todayStr = new Date(now).toISOString().slice(0, 10);

  const grouped = new Map();

  for (const { name, type, date } of data) {
    if (!grouped.has(name)) grouped.set(name, {});
    grouped.get(name)[type] = date;
  }

  const result: Record<string, boolean> = {};

  for (const [name, times] of grouped.entries()) {
    const redisStr = times["last_redis"];
    const socketStr = times["last_socket"];
    const checkStr = times["last_check"];

    if (!redisStr || !socketStr || !checkStr) {
      result[name] = false;
      continue;
    }

    // Pre-compare date string to avoid parsing if not today
    if (!redisStr.startsWith(todayStr)) {
      result[name] = false;
      continue;
    }

    const redis = new Date(redisStr).getTime();
    const socket = new Date(socketStr).getTime();
    const check = new Date(checkStr).getTime();

    const socketDiff = Math.abs(socket - redis);
    const checkDiff = Math.abs(check - redis);

    result[name] = socketDiff <= 40000 && checkDiff <= 40000;
  }

  return result;
}
