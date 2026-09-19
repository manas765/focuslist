export function createFocusSession({
  minutes = 25,
  taskId = ""
} = {}) {
  return {
    id:
      `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`,

    date:
      new Date().toISOString(),

    minutes,

    taskId
  };
}

export function formatMinutes(minutes) {
  const value =
    Number(minutes) || 0;

  if (value < 60) {
    return `${value}m`;
  }

  const hours =
    Math.floor(value / 60);

  const mins =
    value % 60;

  return mins
    ? `${hours}h ${mins}m`
    : `${hours}h`;
}