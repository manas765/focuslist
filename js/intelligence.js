const PRIORITY_WEIGHT = {
  high: 45,
  medium: 25,
  low: 10
};


function daysUntil(dateString) {

  if (!dateString) {
    return 99;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const due =
    new Date(
      `${dateString}T00:00:00`
    );

  return Math.round(
    (due - today) /
    86400000
  );
}


export function scoreTask(task) {

  if (
    !task ||
    task.completed
  ) {
    return -Infinity;
  }


  let score =
    PRIORITY_WEIGHT[
      task.priority
    ] || 10;


  const days =
    daysUntil(
      task.dueAt
    );


  if (days < 0) {
    score += 50;
  }

  else if (days === 0) {
    score += 40;
  }

  else if (days === 1) {
    score += 28;
  }

  else if (days <= 3) {
    score += 16;
  }

  else if (days <= 7) {
    score += 8;
  }


  const estimate =
    Number(
      task.estimate
    ) || 25;


  if (estimate <= 15) {
    score += 6;
  }

  else if (estimate <= 30) {
    score += 3;
  }


  if (
    task.notes?.trim()
  ) {
    score += 2;
  }


  if (
    task.project?.trim()
  ) {
    score += 2;
  }


  return score;
}


export function recommendNextTask(
  tasks
) {

  const candidates =
    tasks

      .filter(
        task =>
          !task.completed
      )

      .map(
        task => ({
          task,
          score:
            scoreTask(task)
        })
      )

      .sort(
        (a, b) =>
          b.score -
          a.score
      );


  if (
    !candidates.length
  ) {
    return null;
  }


  const {
    task,
    score
  } =
    candidates[0];


  const reasons = [];

  const days =
    daysUntil(
      task.dueAt
    );


  if (
    task.priority === "high"
  ) {

    reasons.push(
      "high priority"
    );

  }

  else if (
    task.priority === "medium"
  ) {

    reasons.push(
      "medium priority"
    );

  }


  if (days < 0) {

    reasons.push(
      "overdue"
    );

  }

  else if (days === 0) {

    reasons.push(
      "due today"
    );

  }

  else if (days === 1) {

    reasons.push(
      "due tomorrow"
    );

  }

  else if (days <= 3) {

    reasons.push(
      "due soon"
    );

  }


  if (
    (Number(task.estimate) || 25) <= 30
  ) {

    reasons.push(
      `${task.estimate || 25}-minute task`
    );

  }


  if (
    !reasons.length
  ) {

    reasons.push(
      "best match for your current queue"
    );

  }


  return {

    task,

    score,

    reasons:
      reasons.slice(0, 3)

  };
}