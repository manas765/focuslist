import {
  completionStats,
  weeklyFocusMinutes,
  productiveStreak,
  lastSevenDays,
  todayKey,
  focusScore,
  dailyWorkload
} from "./analytics.js";

import {
  formatMinutes
} from "./focus.js";

import {
  rankTasks
} from "./intelligence.js";


/* =========================================
   SECURITY / HTML ESCAPING
========================================= */

const escapeHTML = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );


/* =========================================
   DATE HELPERS
========================================= */

export function dueLabel(dueAt) {

  if (!dueAt) {
    return "";
  }

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const due =
    new Date(`${dueAt}T00:00:00`);

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


/* =========================================
   TASK LIST
========================================= */

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
          ${escapeHTML(emptyTitle)}
        </strong>

        <span>
          Capture a task above or
          change your filters.
        </span>

      </div>
    `;

    return;
  }


  container.innerHTML = tasks
    .map(task => {

      const due =
        dueLabel(task.dueAt);

      return `

        <article
          class="task-card ${task.completed ? "task-done" : ""}"
          draggable="true"
          data-id="${escapeHTML(task.id)}"
        >

          <div
            class="priority-bar priority-${escapeHTML(task.priority)}"
            aria-hidden="true"
          ></div>


          <button
            class="check ${task.completed ? "done" : ""}"
            data-action="toggle"
            aria-label="${
              task.completed
                ? "Mark incomplete"
                : "Mark complete"
            }"
          >
            ${task.completed ? "✓" : ""}
          </button>


          <div class="task-content">

            <div class="task-title">
              ${escapeHTML(task.title)}
            </div>


            <div class="task-meta">

              <span class="badge">
                ${escapeHTML(task.priority)}
                priority
              </span>


              <span class="badge">
                ${task.estimate || 25} min
              </span>


              ${
                task.project
                  ? `
                    <span class="badge project">
                      ${escapeHTML(task.project)}
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
                      ${escapeHTML(due)}
                    </span>
                  `
                  : ""
              }

            </div>


            ${
              task.notes
                ? `
                  <div class="task-note">
                    ${escapeHTML(task.notes)}
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
                    aria-label="Focus on ${escapeHTML(task.title)}"
                  >
                    ▶
                  </button>
                `
                : ""
            }


            <button
              data-action="edit"
              title="Edit task"
              aria-label="Edit ${escapeHTML(task.title)}"
            >
              ✎
            </button>


            <button
              data-action="delete"
              title="Delete task"
              aria-label="Delete ${escapeHTML(task.title)}"
            >
              ×
            </button>

          </div>

        </article>
      `;

    })
    .join("");


  /* Drag + drop */

  container
    .querySelectorAll(".task-card")
    .forEach(card => {

      card.addEventListener(
        "dragstart",
        event => {

          event.dataTransfer.effectAllowed =
            "move";

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
          event.dataTransfer.dropEffect =
            "move";
        }
      );


      card.addEventListener(
        "drop",
        event => {

          event.preventDefault();

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

          const button =
            event.target.closest(
              "[data-action]"
            );

          if (!button) {
            return;
          }

          const action =
            button.dataset.action;

          if (
            typeof handlers[action] ===
            "function"
          ) {
            handlers[action](
              card.dataset.id
            );
          }

        }
      );

    });

}


/* =========================================
   GLOBAL STATS
========================================= */

export function renderStats(state) {

  const stats =
    completionStats(state.tasks);

  const score =
    focusScore(state);


  const statToday =
    document.querySelector("#statToday");

  const statOpen =
    document.querySelector("#statOpen");

  const statFocus =
    document.querySelector("#statFocus");

  const statScore =
    document.querySelector("#statScore");


  if (statToday) {
    statToday.textContent =
      `${stats.percent}%`;
  }

  if (statOpen) {
    statOpen.textContent =
      stats.active;
  }

  if (statFocus) {
    statFocus.textContent =
      formatMinutes(
        weeklyFocusMinutes(
          state.sessions
        )
      );
  }

  if (statScore) {
    statScore.textContent =
      score;
  }


  /* Inbox */

  const inboxCount =
    document.querySelector(
      "#inboxCount"
    );

  if (inboxCount) {

    inboxCount.textContent =
      state.tasks.filter(
        task =>
          !task.dueAt &&
          !task.completed
      ).length;

  }


  /* Daily target */

  const targetDone =
    state.tasks.filter(
      task =>
        task.completedDate ===
        todayKey()
    ).length;


  const target =
    Math.max(
      1,
      state.target || 3
    );


  const targetPercent =
    Math.min(
      100,
      Math.round(
        targetDone /
        target *
        100
      )
    );


  const targetValue =
    document.querySelector(
      "#dailyTargetValue"
    );

  const targetBar =
    document.querySelector(
      "#dailyTargetBar"
    );

  const targetText =
    document.querySelector(
      "#dailyTargetText"
    );


  if (targetValue) {
    targetValue.textContent =
      target;
  }

  if (targetBar) {
    targetBar.style.width =
      `${targetPercent}%`;
  }

  if (targetText) {
    targetText.textContent =
      `${targetDone} / ${target} completed`;
  }


  /* Goal ring */

  const goalPercent =
    document.querySelector(
      "#goalPercent"
    );

  const goalRing =
    document.querySelector(
      "#goalRing"
    );

  const goalMessage =
    document.querySelector(
      "#goalMessage"
    );


  if (goalPercent) {
    goalPercent.textContent =
      `${targetPercent}%`;
  }


  if (goalRing) {

    goalRing.style.setProperty(
      "--progress",
      `${targetPercent * 3.6}deg`
    );

    goalRing.setAttribute(
      "aria-label",
      `Daily completion ${targetPercent}%`
    );

  }


  if (goalMessage) {

    goalMessage.textContent =
      targetDone >= target
        ? "Target reached. Protect the rest of your attention."
        : `${Math.max(
            0,
            target - targetDone
          )} more important task${
            target - targetDone === 1
              ? ""
              : "s"
          } to hit today's target.`;

  }


  /* Workload */

  const workload =
    document.querySelector(
      "#workloadValue"
    );

  if (workload) {

    workload.textContent =
      formatMinutes(
        dailyWorkload(
          state.tasks
        )
      );

  }


  /* Score bar */

  const scoreBar =
    document.querySelector(
      "#scoreBar"
    );

  if (scoreBar) {

    scoreBar.style.width =
      `${score}%`;

  }


  const scoreOrb =
    document.querySelector(
      "#scoreOrb"
    );

  if (scoreOrb) {

    scoreOrb.style.setProperty(
      "--score",
      score
    );

  }

}


/* =========================================
   SMART DAILY PLAN
========================================= */

export function renderDailyPlan(
  state,
  handlers
) {

  const container =
    document.querySelector(
      "#dailyPlanList"
    );

  if (!container) {
    return;
  }


  const plan =
    rankTasks(
      state.tasks
    ).slice(0, 3);


  if (!plan.length) {

    container.innerHTML = `
      <div class="empty compact">

        <strong>
          Your plan is clear.
        </strong>

        <span>
          Add an open task and
          FocusList will build
          your plan automatically.
        </span>

      </div>
    `;

    return;
  }


  container.innerHTML =
    plan.map(
      ({ task, score }, index) => `

        <article class="plan-item">

          <div class="plan-number">
            ${index + 1}
          </div>


          <div class="plan-main">

            <strong>
              ${escapeHTML(task.title)}
            </strong>

            <span>
              ${escapeHTML(task.priority)}
              priority ·
              ${task.estimate || 25} min

              ${
                task.dueAt
                  ? ` · ${escapeHTML(
                      dueLabel(
                        task.dueAt
                      )
                    )}`
                  : ""
              }

            </span>

          </div>


          <span
            class="plan-score"
            title="Explainable priority score"
          >
            ${score}
          </span>


          <button
            class="secondary-button small"
            data-plan-focus="${escapeHTML(task.id)}"
          >
            Focus
          </button>

        </article>
      `
    ).join("");


  container
    .querySelectorAll(
      "[data-plan-focus]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          handlers.focus(
            button.dataset.planFocus
          );

        }
      );

    });

}


/* =========================================
   FOCUS INTELLIGENCE
========================================= */

export function renderRecommendation(
  state,
  handlers
) {

  const card =
    document.querySelector(
      "#recommendationCard"
    );

  if (!card) {
    return;
  }


  const recommendation =
    rankTasks(state.tasks)[0];


  if (!recommendation) {

    card.innerHTML = `

      <div>

        <span class="recommendation-label">
          READY
        </span>

        <h3>
          No open task yet.
        </h3>

        <p>
          Add something you want to
          accomplish and FocusList will
          build a reasoned next-step
          recommendation.
        </p>

      </div>

    `;

    return;
  }


  const {
    task,
    score
  } = recommendation;


  const reasons = [];


  if (task.priority === "high") {
    reasons.push(
      "High priority"
    );
  }

  if (task.dueAt) {

    reasons.push(
      dueLabel(task.dueAt)
    );

  }

  reasons.push(
    `${task.estimate || 25}-minute estimate`
  );


  card.innerHTML = `

    <div>

      <span class="recommendation-label">
        RECOMMENDED NEXT
      </span>


      <h3>
        ${escapeHTML(task.title)}
      </h3>


      <p>
        FocusList prioritizes urgency,
        importance, task size and available
        context locally. Your task data
        is not sent to an AI service.
      </p>


      <div class="recommendation-reasons">

        ${reasons
          .slice(0, 3)
          .map(
            reason => `
              <span>
                ${escapeHTML(reason)}
              </span>
            `
          )
          .join("")}

      </div>

    </div>


    <div class="recommendation-score">

      <strong>
        ${score}
      </strong>

      <small>
        PRIORITY SCORE
      </small>


      <button
        class="primary-button small"
        id="recommendationFocus"
      >
        Start focus
      </button>

    </div>

  `;


  const focusButton =
    document.querySelector(
      "#recommendationFocus"
    );


  if (focusButton) {

    focusButton.onclick =
      () => handlers.focus(
        task.id
      );

  }

}


/* =========================================
   ANALYTICS
========================================= */

export function renderAnalytics(state) {

  const days =
    lastSevenDays(
      state.tasks
    );


  /* Chart */

  const chart =
    document.querySelector(
      "#completionChart"
    );


  if (chart) {

    const max =
      Math.max(
        1,
        ...days.map(
          day => day.count
        )
      );


    chart.innerHTML =
      days
        .map(
          day => `

            <div class="bar-col">

              <span>
                ${day.count}
              </span>

              <div
                class="bar"
                style="
                  height:${Math.max(
                    3,
                    day.count /
                    max *
                    180
                  )}px
                "
              ></div>

              <small>
                ${escapeHTML(
                  day.label
                )}
              </small>

            </div>

          `
        )
        .join("");

  }


  /* Score */

  const score =
    focusScore(state);


  const analyticsScore =
    document.querySelector(
      "#analyticsScore"
    );

  if (analyticsScore) {
    analyticsScore.textContent =
      score;
  }


  const scoreBar =
    document.querySelector(
      "#scoreBar"
    );

  if (scoreBar) {
    scoreBar.style.width =
      `${score}%`;
  }


  const scoreOrb =
    document.querySelector(
      "#scoreOrb"
    );

  if (scoreOrb) {

    scoreOrb.style.setProperty(
      "--score",
      score
    );

  }


  /* Basic insights */

  const completed =
    state.tasks.filter(
      task => task.completed
    ).length;


  const highDone =
    state.tasks.filter(
      task =>
        task.priority === "high" &&
        task.completed
    ).length;


  const highTotal =
    state.tasks.filter(
      task =>
        task.priority === "high"
    ).length;


  const completedTasks =
    state.tasks.filter(
      task => task.completed
    );


  const avgEstimate =
    completedTasks.length
      ? Math.round(
          completedTasks.reduce(
            (sum, task) =>
              sum +
              (
                Number(
                  task.estimate
                ) || 25
              ),
            0
          ) /
          completedTasks.length
        )
      : 0;


  const insightList =
    document.querySelector(
      "#insightList"
    );


  if (insightList) {

    insightList.innerHTML = `

      <div class="insight">

        <strong>
          ${completed}
          tasks completed
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
          }%
          of high-priority tasks finished
        </strong>

        <span>
          Keep urgent work visible without
          letting it crowd out everything else.
        </span>

      </div>


      <div class="insight">

        <strong>
          ${avgEstimate || 0}
          min average estimate
        </strong>

        <span>
          Estimates make daily planning
          more realistic.
        </span>

      </div>


      <div class="insight">

        <strong>
          ${score}/100 focus score
        </strong>

        <span>
          Based on completion, focus time
          and productive-day consistency.
        </span>

      </div>

    `;

  }


  /* Priority breakdown */

  const breakdown =
    document.querySelector(
      "#priorityBreakdown"
    );


  if (breakdown) {

    const priorities = [
      "high",
      "medium",
      "low"
    ];


    const total =
      Math.max(
        1,
        state.tasks.length
      );


    breakdown.innerHTML =
      priorities
        .map(priority => {

          const count =
            state.tasks.filter(
              task =>
                task.priority ===
                priority
            ).length;


          return `

            <div class="break-row">

              <span>
                ${priority}
              </span>

              <i>

                <span
                  style="
                    width:${
                      count /
                      total *
                      100
                    }%
                  "
                ></span>

              </i>

              <b>
                ${count}
              </b>

            </div>

          `;

        })
        .join("");

  }


  /* Weekly focus */

  const weeklyFocus =
    weeklyFocusMinutes(
      state.sessions
    );


  const weeklyMetric =
    document.querySelector(
      "#weeklyFocusMetric"
    );


  if (weeklyMetric) {

    weeklyMetric.textContent =
      weeklyFocus;

  }

}