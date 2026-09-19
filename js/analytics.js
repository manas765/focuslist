function dayKey(date) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

export function todayKey() {
  return dayKey(new Date());
}

export function startOfWeek() {
  const d = new Date();

  const day = d.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  d.setDate(
    d.getDate() + diff
  );

  d.setHours(
    0,
    0,
    0,
    0
  );

  return d;
}

export function completionStats(tasks) {

  const active =
    tasks.filter(
      t => !t.completed
    );

  const completed =
    tasks.filter(
      t => t.completed
    );

  const today =
    todayKey();

  const todayTasks =
    tasks.filter(
      t =>
        dayKey(t.createdAt) === today ||
        t.completedDate === today ||
        t.dueAt === today
    );

  const todayDone =
    todayTasks.filter(
      t => t.completed
    ).length;

  return {

    active:
      active.length,

    completed:
      completed.length,

    todayTotal:
      todayTasks.length,

    todayDone,

    percent:
      todayTasks.length
        ? Math.round(
            todayDone /
            todayTasks.length *
            100
          )
        : 0

  };
}

export function weeklyFocusMinutes(sessions) {

  const start =
    startOfWeek();

  return sessions
    .filter(
      s =>
        new Date(s.date) >= start
    )
    .reduce(
      (sum, s) =>
        sum + (s.minutes || 0),
      0
    );
}

export function productiveStreak(tasks) {

  const doneDays =
    new Set(
      tasks
        .filter(
          t => t.completedDate
        )
        .map(
          t => t.completedDate
        )
    );

  let streak = 0;

  const d = new Date();

  while (
    doneDays.has(
      dayKey(d)
    )
  ) {

    streak++;

    d.setDate(
      d.getDate() - 1
    );
  }

  return streak;
}

export function lastSevenDays(tasks) {

  const result = [];

  for (
    let i = 6;
    i >= 0;
    i--
  ) {

    const d = new Date();

    d.setHours(
      0,
      0,
      0,
      0
    );

    d.setDate(
      d.getDate() - i
    );

    const key =
      dayKey(d);

    const count =
      tasks.filter(
        t =>
          t.completedDate === key
      ).length;

    result.push({
      key,

      label:
        d.toLocaleDateString(
          undefined,
          {
            weekday: "short"
          }
        ),

      count
    });
  }

  return result;
}