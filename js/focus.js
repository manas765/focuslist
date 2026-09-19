// Focus-session domain helper.

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