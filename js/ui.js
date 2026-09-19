import {
  completionStats,
  weeklyFocusMinutes,
  productiveStreak,
  lastSevenDays,
  todayKey
} from "./analytics.js";


const escapeHTML =
  value =>
    String(value ?? "")
      .replace(
        /[&<>"']/g,
        ch =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
          }[ch])
      );


export function dueLabel(dueAt) {

  if (!dueAt) {
    return "";
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
      dueAt + "T00:00:00"
    );

  const diff =
    Math.round(
      (due - today) /
      86400000
    );


  if (diff < 0) {
    return "Overdue";
  }

  if (diff === 0) {
    return "Today";
  }

  if (diff === 1) {
    return "Tomorrow";
  }

  return due.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short"
    }
  );
}


export function renderTaskList(
  container,
  tasks,
  handlers,
  emptyTitle = "Nothing here."
) {

  if (!tasks.length) {

    container.innerHTML = `
      <div class="empty">

        <strong>
          ${emptyTitle}
        </strong>

        <span>
          Capture a task above or change your filters.
        </span>

      </div>
    `;

    return;
  }


  container.innerHTML =
    tasks
      .map(
        task => {

          const due =
            dueLabel(
              task.dueAt
            );


          return `

            <article
              class="task-card ${
                task.completed
                  ? "task-done"
                  : ""
              }"
              draggable="true"
              data-id="${task.id}"
            >

              <div
                class="priority-bar priority-${task.priority}"
                aria-hidden="true"
              ></div>


              <button
                class="check ${
                  task.completed
                    ? "done"
                    : ""
                }"
                data-action="toggle"
                aria-label="${
                  task.completed
                    ? "Mark incomplete"
                    : "Mark complete"
                }"
              >
                ${
                  task.completed
                    ? "✓"
                    : ""
                }
              </button>


              <div>

                <div class="task-title">
                  ${escapeHTML(
                    task.title
                  )}
                </div>


                <div class="task-meta">

                  <span class="badge">
                    ${escapeHTML(
                      task.priority
                    )} priority
                  </span>

                  <span class="badge">
                    ${task.estimate || 25} min
                  </span>

                  ${
                    task.project
                      ? `
                        <span class="badge project">
                          ${escapeHTML(
                            task.project
                          )}
                        </span>
                      `
                      : ""
                  }

                  ${
                    due
                      ? `
                        <span
                          class="badge ${
                            due === "Overdue"
                              ? "overdue"
                              : ""
                          }"
                        >
                          ${due}
                        </span>
                      `
                      : ""
                  }

                </div>


                ${
                  task.notes
                    ? `
                      <div class="task-note">
                        ${escapeHTML(
                          task.notes
                        )}
                      </div>
                    `
                    : ""
                }

              </div>


              <div class="task-actions">

                ${
                  !task.completed
                    ? `
                      <button
                        data-action="focus"
                        title="Focus on this task"
                        aria-label="Focus on ${escapeHTML(
                          task.title
                        )}"
                      >
                        ▶
                      </button>
                    `
                    : ""
                }


                <button
                  data-action="edit"
                  title="Edit task"
                  aria-label="Edit ${escapeHTML(
                    task.title
                  )}"
                >
                  ✎
                </button>


                <button
                  data-action="delete"
                  title="Delete task"
                  aria-label="Delete ${escapeHTML(
                    task.title
                  )}"
                >
                  ×
                </button>

              </div>

            </article>

          `;

        }
      )
      .join("");


  container
    .querySelectorAll(
      ".task-card"
    )
    .forEach(
      card => {

        card.addEventListener(
          "dragstart",
          event => {

            event.dataTransfer.setData(
              "text/plain",
              card.dataset.id
            );

          }
        );


        card.addEventListener(
          "dragover",
          event => {

            event.preventDefault();

          }
        );


        card.addEventListener(
          "drop",
          event => {

            handlers.reorder(
              event.dataTransfer.getData(
                "text/plain"
              ),
              card.dataset.id
            );

          }
        );


        card.addEventListener(
          "click",
          event => {

            const action =
              event.target
                .closest(
                  "[data-action]"
                )
                ?.dataset.action;


            if (action) {

              handlers[action](
                card.dataset.id
              );

            }

          }
        );

      }
    );
}


export function renderStats(state) {

  const stats =
    completionStats(
      state.tasks
    );


  document.querySelector(
    "#statToday"
  ).textContent =
    `${stats.percent}%`;


  document.querySelector(
    "#statOpen"
  ).textContent =
    stats.active;


  document.querySelector(
    "#statFocus"
  ).textContent =
    `${weeklyFocusMinutes(
      state.sessions
    )}m`;


  document.querySelector(
    "#statStreak"
  ).textContent =
    productiveStreak(
      state.tasks
    );


  document.querySelector(
    "#inboxCount"
  ).textContent =
    state.tasks.filter(
      t =>
        !t.dueAt &&
        !t.completed
    ).length;


  const targetDone =
    state.tasks.filter(
      t =>
        t.completedDate ===
        todayKey()
    ).length;


  const targetPercent =
    Math.min(
      100,
      Math.round(
        targetDone /
        Math.max(
          1,
          state.target
        ) *
        100
      )
    );


  document.querySelector(
    "#dailyTargetValue"
  ).textContent =
    state.target;


  document.querySelector(
    "#dailyTargetBar"
  ).style.width =
    `${targetPercent}%`;


  document.querySelector(
    "#dailyTargetText"
  ).textContent =
    `${targetDone} / ${state.target} completed`;


  document.querySelector(
    "#goalPercent"
  ).textContent =
    `${targetPercent}%`;


  document.querySelector(
    "#goalRing"
  ).style.background =
    `
      conic-gradient(
        var(--green)
        ${targetPercent * 3.6}deg,
        var(--surface-2)
        0deg
      )
    `;


  document.querySelector(
    "#goalMessage"
  ).textContent =

    targetDone >= state.target

      ? "Target reached. Protect the rest of your attention."

      : `
        ${Math.max(
          0,
          state.target - targetDone
        )}
        more important task${
          state.target - targetDone === 1
            ? ""
            : "s"
        }
        to hit today's target.
      `;
}


export function renderAnalytics(state) {

  const days =
    lastSevenDays(
      state.tasks
    );


  const chart =
    document.querySelector(
      "#completionChart"
    );


  const max =
    Math.max(
      1,
      ...days.map(
        d => d.count
      )
    );


  chart.innerHTML =
    days
      .map(
        d => `

          <div class="bar-col">

            <span>
              ${d.count}
            </span>

            <div
              class="bar"
              style="height:${Math.max(
                3,
                d.count / max * 180
              )}px"
            ></div>

            <small>
              ${d.label}
            </small>

          </div>

        `
      )
      .join("");


  const completed =
    state.tasks.filter(
      t => t.completed
    ).length;


  const highDone =
    state.tasks.filter(
      t =>
        t.priority === "high" &&
        t.completed
    ).length;


  const highTotal =
    state.tasks.filter(
      t =>
        t.priority === "high"
    ).length;


  const avgEstimate =
    completed

      ? Math.round(
          state.tasks
            .filter(
              t =>
                t.completed
            )
            .reduce(
              (a, t) =>
                a +
                (t.estimate || 25),
              0
            ) /
            completed
        )

      : 0;


  document.querySelector(
    "#insightList"
  ).innerHTML = `

    <div class="insight">

      <strong>
        ${completed} tasks completed
      </strong>

      <span>
        Across your current local history.
      </span>

    </div>


    <div class="insight">

      <strong>
        ${
          highTotal
            ? Math.round(
                highDone /
                highTotal *
                100
              )
            : 0
        }% of high-priority tasks finished
      </strong>

      <span>
        Keep urgent work visible, but don't let it crowd out everything else.
      </span>

    </div>


    <div class="insight">

      <strong>
        ${avgEstimate || 0} min average estimate
      </strong>

      <span>
        Use estimates to make daily planning more realistic.
      </span>

    </div>

  `;


  const priorities =
    [
      "high",
      "medium",
      "low"
    ];


  const total =
    Math.max(
      1,
      state.tasks.length
    );


  document.querySelector(
    "#priorityBreakdown"
  ).innerHTML =

    priorities
      .map(
        p => {

          const count =
            state.tasks.filter(
              t =>
                t.priority === p
            ).length;


          return `

            <div class="break-row">

              <span>
                ${p}
              </span>

              <i>

                <span
                  style="width:${count / total * 100}%"
                ></span>

              </i>

              <b>
                ${count}
              </b>

            </div>

          `;

        }
      )
      .join("");


  document.querySelector(
    "#weeklyFocusMetric"
  ).textContent =
    weeklyFocusMinutes(
      state.sessions
    );
}