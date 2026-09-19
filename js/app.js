import {
  loadState,
  saveState
} from "./storage.js";

import {
  renderTaskList,
  renderStats,
  renderAnalytics,
  renderDailyPlan,
  renderRecommendation
} from "./ui.js";

import {
  createTask,
  matchesTask,
  sortTaskCollection
} from "./tasks.js";

import {
  createFocusSession
} from "./focus.js";

import {
  getCommands
} from "./commands.js";


/* =========================================
   APPLICATION STATE
========================================= */

const state =
  loadState();


let currentView =
  "today";

let currentFilter =
  "all";

let search =
  "";

let sort =
  "smart";

let focusTaskId =
  null;


let timer = {

  seconds: 1500,

  running: false,

  interval: null,

  minutes: 25

};


/* =========================================
   DOM HELPERS
========================================= */

const $ =
  selector =>
    document.querySelector(
      selector
    );


const $$ =
  selector =>
    [
      ...document.querySelectorAll(
        selector
      )
    ];


/* =========================================
   BASIC HELPERS
========================================= */

function today() {

  return new Date()
    .toISOString()
    .slice(0, 10);

}


function taskById(id) {

  return state.tasks.find(
    task =>
      task.id === id
  );

}


function save() {

  saveState(state);

  render();

}


/* =========================================
   TOAST
========================================= */

function showToast(message) {

  const toast =
    $("#toast");

  if (!toast) {
    return;
  }


  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2200
    );

}


/* =========================================
   ADD TASK
========================================= */

function addTask(event) {

  event.preventDefault();


  const title =
    $("#taskTitle")
      .value
      .trim();


  if (!title) {
    return;
  }


  const task =
    createTask({

      title,

      priority:
        $("#taskPriority")
          .value,

      dueAt:
        $("#taskDue")
          .value,

      estimate:
        $("#taskEstimate")
          .value,

      project:
        $("#taskProject")
          .value,

      notes:
        $("#taskNotes")
          .value

    });


  state.tasks.unshift(
    task
  );


  event.target.reset();


  $("#taskPriority")
    .value =
    "medium";


  $("#taskEstimate")
    .value =
    25;


  save();


  showToast(
    "Task added to your workspace"
  );

}


/* =========================================
   TOGGLE TASK
========================================= */

function toggleTask(id) {

  const task =
    taskById(id);


  if (!task) {
    return;
  }


  task.completed =
    !task.completed;


  task.completedDate =
    task.completed
      ? today()
      : "";


  save();


  showToast(
    task.completed
      ? "Task completed ✓"
      : "Task reopened"
  );

}


/* =========================================
   EDIT TASK
========================================= */

function editTask(id) {

  const task =
    taskById(id);


  if (!task) {
    return;
  }


  const title =
    prompt(
      "Task title",
      task.title
    );


  if (title === null) {
    return;
  }


  const cleanTitle =
    title.trim();


  if (cleanTitle) {
    task.title =
      cleanTitle;
  }


  const notes =
    prompt(
      "Notes (optional)",
      task.notes || ""
    );


  if (notes !== null) {

    task.notes =
      notes.trim();

  }


  save();


  showToast(
    "Task updated"
  );

}


/* =========================================
   DELETE TASK
========================================= */

function deleteTask(id) {

  const index =
    state.tasks.findIndex(
      task =>
        task.id === id
    );


  if (index < 0) {
    return;
  }


  const [
    removed
  ] =
    state.tasks.splice(
      index,
      1
    );


  if (
    focusTaskId ===
    removed.id
  ) {

    focusTaskId =
      null;

    stopTimer();

  }


  save();


  showToast(
    `Deleted "${removed.title}"`
  );

}


/* =========================================
   FOCUS MODE
========================================= */

function focusOn(id) {

  const task =
    taskById(id);


  if (!task) {
    return;
  }


  focusTaskId =
    id;


  currentView =
    "focus";


  stopTimer();


  setTimer(25);


  render();


  setTimeout(
    () => {

      const startButton =
        $("#timerStart");

      if (startButton) {
        startButton.focus();
      }

    },
    0
  );

}


/* =========================================
   DRAG + DROP
========================================= */

function reorder(
  from,
  to
) {

  if (
    !from ||
    !to ||
    from === to
  ) {
    return;
  }


  const fromIndex =
    state.tasks.findIndex(
      task =>
        task.id === from
    );


  const toIndex =
    state.tasks.findIndex(
      task =>
        task.id === to
    );


  if (
    fromIndex < 0 ||
    toIndex < 0
  ) {
    return;
  }


  const [
    item
  ] =
    state.tasks.splice(
      fromIndex,
      1
    );


  state.tasks.splice(
    toIndex,
    0,
    item
  );


  save();


  showToast(
    "Task order updated"
  );

}


/* =========================================
   TASK RENDERING
========================================= */

function renderTasks() {

  const filtered =
    state.tasks.filter(
      task =>
        matchesTask(
          task,
          {
            filter:
              currentFilter,

            search
          }
        )
    );


  const list =
    sortTaskCollection(
      filtered,
      sort
    );


  const handlers = {

    toggle:
      toggleTask,

    edit:
      editTask,

    delete:
      deleteTask,

    focus:
      focusOn,

    reorder

  };


  renderTaskList(
    $("#taskList"),
    list,
    handlers
  );


  /* Inbox */

  const inbox =
    state.tasks.filter(
      task =>
        !task.dueAt &&
        !task.completed
    );


  renderTaskList(
    $("#inboxList"),
    inbox,
    handlers,
    "Your inbox is clear."
  );


  /* Focus queue */

  const queue =
    sortTaskCollection(
      state.tasks.filter(
        task =>
          !task.completed
      ),
      "smart"
    ).slice(0, 5);


  const queueElement =
    $("#focusQueue");


  if (!queueElement) {
    return;
  }


  if (!queue.length) {

    queueElement.innerHTML =
      `
        <div class="empty">
          No open tasks.
        </div>
      `;

    return;
  }


  queueElement.innerHTML =
    queue
      .map(
        task => `

          <div class="queue-item">

            <button
              data-queue="${escapeText(task.id)}"
            >
              ${escapeText(
                task.title
              )}
            </button>

            <small>
              ${task.estimate || 25}m
            </small>

          </div>

        `
      )
      .join("");


  $$(
    "#focusQueue [data-queue]"
  ).forEach(button => {

    button.onclick =
      () =>
        focusOn(
          button.dataset.queue
        );

  });

}


/* =========================================
   ESCAPE
========================================= */

function escapeText(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[
        character
      ])
  );

}


/* =========================================
   FOCUS VIEW
========================================= */

function renderFocus() {

  const task =
    taskById(
      focusTaskId
    );


  const name =
    $("#focusTaskName");

  const meta =
    $("#focusTaskMeta");


  if (!name || !meta) {
    return;
  }


  if (!task) {

    name.textContent =
      "Pick a task to begin.";

    meta.textContent =
      "A focused session turns an intention into measurable progress.";

    return;
  }


  name.textContent =
    task.title;


  meta.textContent =
    `${task.priority} priority · ${
      task.estimate || 25
    } min estimate${
      task.project
        ? ` · ${task.project}`
        : ""
    }`;

}


/* =========================================
   VIEW SWITCHING
========================================= */

function renderView() {

  const views = $$(`
    #dashboardView,
    #focusView,
    #analyticsView,
    #inboxView
  `);


  views.forEach(
    view =>
      view.classList.add(
        "hidden"
      )
  );


  const viewMap = {

    today:
      "#dashboardView",

    focus:
      "#focusView",

    analytics:
      "#analyticsView",

    inbox:
      "#inboxView"

  };


  const activeView =
    $(viewMap[currentView]);


  if (activeView) {

    activeView.classList.remove(
      "hidden"
    );

  }


  $$(".nav-item")
    .forEach(button => {

      const active =
        button.dataset.view ===
        currentView;


      button.classList.toggle(
        "active",
        active
      );


      if (active) {

        button.setAttribute(
          "aria-current",
          "page"
        );

      } else {

        button.removeAttribute(
          "aria-current"
        );

      }

    });


  const titles = {

    today: [
      "TODAY",
      "A clear-headed task desk.",
      "Everything important, without the noise."
    ],

    focus: [
      "FOCUS MODE",
      "One task. One timer. No noise.",
      "Turn a task into a focused work session."
    ],

    analytics: [
      "INSIGHTS",
      "See how you actually work.",
      "Small signals that make planning easier."
    ],

    inbox: [
      "INBOX",
      "Capture now. Schedule later.",
      "Unscheduled tasks stay here until you're ready."
    ]

  };


  const title =
    titles[currentView];


  $("#viewEyebrow")
    .textContent =
    title[0];


  $("#viewTitle")
    .textContent =
    title[1];


  $("#viewSubtitle")
    .textContent =
    title[2];


  renderFocus();

}


/* =========================================
   MASTER RENDER
========================================= */

function render() {

  renderStats(
    state
  );


  renderDailyPlan(
    state,
    {
      focus:
        focusOn
    }
  );


  renderRecommendation(
    state,
    {
      focus:
        focusOn
    }
  );


  renderTasks();


  renderAnalytics(
    state
  );


  renderView();


  applyTheme();


  updateTimerUI();

}


/* =========================================
   THEME
========================================= */

function applyTheme() {

  document.documentElement
    .dataset.theme =
      state.theme === "dark"
        ? "dark"
        : "light";


  const icon =
    $("#themeIcon");


  if (icon) {

    icon.textContent =
      state.theme === "dark"
        ? "☀"
        : "☾";

  }

}


/* =========================================
   NAVIGATION
========================================= */

function setView(view) {

  currentView =
    view;


  render();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================
   TIMER
========================================= */

function setTimer(minutes) {

  stopTimer();


  timer.minutes =
    minutes;

  timer.seconds =
    minutes * 60;


  updateTimerUI();


  $$(".timer-options button")
    .forEach(button => {

      button.classList.toggle(
        "selected",
        Number(
          button.dataset.minutes
        ) === minutes
      );

    });

}


function updateTimerUI() {

  const display =
    $("#timerDisplay");


  const startButton =
    $("#timerStart");


  const status =
    $("#timerStatus");


  if (!display) {
    return;
  }


  const minutes =
    String(
      Math.floor(
        timer.seconds / 60
      )
    ).padStart(
      2,
      "0"
    );


  const seconds =
    String(
      timer.seconds % 60
    ).padStart(
      2,
      "0"
    );


  display.textContent =
    `${minutes}:${seconds}`;


  if (startButton) {

    startButton.textContent =
      timer.running
        ? "Pause session"
        : "Start session";

  }


  if (status) {

    status.textContent =
      timer.running
        ? "Deep work in progress"
        : "Ready when you are";

  }

}


function stopTimer() {

  if (timer.interval) {

    clearInterval(
      timer.interval
    );

  }


  timer.interval =
    null;

  timer.running =
    false;


  if ($("#timerDisplay")) {

    updateTimerUI();

  }

}


function startTimer() {

  if (timer.running) {

    stopTimer();

    showToast(
      "Focus session paused"
    );

    return;

  }


  timer.running =
    true;


  updateTimerUI();


  timer.interval =
    setInterval(
      () => {

        timer.seconds--;

        updateTimerUI();


        if (
          timer.seconds <= 0
        ) {

          clearInterval(
            timer.interval
          );


          timer.interval =
            null;


          timer.running =
            false;


          const session =
            createFocusSession({
              minutes:
                timer.minutes,

              taskId:
                focusTaskId || ""
            });


          state.sessions.push(
            session
          );


          const task =
            taskById(
              focusTaskId
            );


          if (task) {

            showToast(
              `Focus session complete — ${task.title}`
            );

          } else {

            showToast(
              "Focus session complete"
            );

          }


          save();


          setTimer(
            25
          );

        }

      },
      1000
    );

}


/* =========================================
   COMMAND PALETTE
========================================= */

function openCommands() {

  const dialog =
    $("#commandDialog");


  if (!dialog) {
    return;
  }


  $("#commandInput")
    .value = "";


  renderCommands(
    ""
  );


  dialog.showModal();


  setTimeout(
    () => {

      $("#commandInput")
        ?.focus();

    },
    0
  );

}


function renderCommands(query) {

  const commands =
    getCommands({

      newTask:
        () => {

          setView(
            "today"
          );

          $("#taskTitle")
            ?.focus();

        },


      focus:
        () =>
          setView(
            "focus"
          ),


      insights:
        () =>
          setView(
            "analytics"
          ),


      inbox:
        () =>
          setView(
            "inbox"
          ),


      theme:
        () =>
          $("#themeToggle")
            ?.click(),


      clearCompleted:
        () =>
          $("#clearCompleted")
            ?.click()

    });


  const filtered =
    commands.filter(
      command =>
        command[0]
          .toLowerCase()
          .includes(
            query.toLowerCase()
          )
    );


  $("#commandList").innerHTML =
    filtered
      .map(
        (command, index) => `

          <button
            class="command-item"
            data-command="${index}"
          >

            <span>
              ${escapeText(
                command[0]
              )}
            </span>

            <small>
              ${escapeText(
                command[1]
              )}
            </small>

          </button>

        `
      )
      .join("");


  $$("#commandList [data-command]")
    .forEach(button => {

      button.onclick =
        () => {

          const command =
            filtered[
              Number(
                button.dataset.command
              )
            ];


          command[2]();


          $("#commandDialog")
            .close();

        };

    });

}


/* =========================================
   EVENT LISTENERS
========================================= */

$("#taskForm")
  .addEventListener(
    "submit",
    addTask
  );


$("#searchInput")
  .addEventListener(
    "input",
    event => {

      search =
        event.target.value;

      renderTasks();

    }
  );


$("#sortSelect")
  .addEventListener(
    "change",
    event => {

      sort =
        event.target.value;

      renderTasks();

    }
  );


$("#statusSelect")
  .addEventListener(
    "change",
    event => {

      currentFilter =
        event.target.value;

      renderTasks();

    }
  );


$$(".nav-item")
  .forEach(button => {

    button.onclick =
      () =>
        setView(
          button.dataset.view
        );

  });


$$(".filter-link")
  .forEach(button => {

    button.onclick =
      () => {

        currentFilter =
          button.dataset.filter;


        $("#statusSelect")
          .value =
          currentFilter;


        setView(
          "today"
        );


        renderTasks();

      };

  });


$("#themeToggle")
  .onclick =
    () => {

      state.theme =
        state.theme === "dark"
          ? "light"
          : "dark";


      save();

    };


$("#focusHeaderButton")
  .onclick =
    () =>
      setView(
        "focus"
      );


$("#backToToday")
  .onclick =
    () =>
      setView(
        "today"
      );


$("#timerStart")
  .onclick =
    startTimer;


$("#timerReset")
  .onclick =
    () =>
      setTimer(
        timer.minutes
      );


$$(".timer-options button")
  .forEach(button => {

    button.onclick =
      () =>
        setTimer(
          Number(
            button.dataset.minutes
          )
        );

  });


$("#clearCompleted")
  .onclick =
    () => {

      const before =
        state.tasks.length;


      state.tasks =
        state.tasks.filter(
          task =>
            !task.completed
        );


      save();


      showToast(
        `${
          before -
          state.tasks.length
        } completed task(s) cleared`
      );

    };


$("#editTarget")
  .onclick =
    () => {

      $("#targetInput")
        .value =
        state.target;


      $("#targetDialog")
        .showModal();

    };


$("#saveTarget")
  .onclick =
    () => {

      state.target =
        Math.max(
          1,
          Math.min(
            20,
            Number(
              $("#targetInput")
                .value
            ) || 3
          )
        );


      save();


      showToast(
        "Daily target updated"
      );

    };


$("#commandButton")
  .onclick =
    openCommands;


$("#commandClose")
  .onclick =
    () =>
      $("#commandDialog")
        .close();


$("#commandInput")
  .addEventListener(
    "input",
    event =>
      renderCommands(
        event.target.value
      )
  );


/* =========================================
   KEYBOARD SHORTCUTS
========================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      if (
        $("#commandDialog")
          ?.open
      ) {

        $("#commandDialog")
          .close();

      }

      return;

    }


    if (
      (event.ctrlKey ||
        event.metaKey) &&
      event.key.toLowerCase() ===
        "k"
    ) {

      event.preventDefault();

      openCommands();

      return;

    }


    if (
      [
        "INPUT",
        "TEXTAREA",
        "SELECT"
      ].includes(
        document.activeElement
          .tagName
      )
    ) {

      return;

    }


    if (
      event.key ===
      "/"
    ) {

      event.preventDefault();

      setView(
        "today"
      );

      $("#searchInput")
        ?.focus();

    }


    if (
      event.key.toLowerCase() ===
      "n"
    ) {

      event.preventDefault();

      setView(
        "today"
      );

      $("#taskTitle")
        ?.focus();

    }


    if (
      event.key.toLowerCase() ===
      "f"
    ) {

      event.preventDefault();

      setView(
        "focus"
      );

    }


    if (
      event.key ===
      "1"
    ) {

      setView(
        "today"
      );

    }


    if (
      event.key ===
      "2"
    ) {

      setView(
        "inbox"
      );

    }


    if (
      event.key ===
      "4"
    ) {

      setView(
        "analytics"
      );

    }


    if (
      event.key.toLowerCase() ===
      "t"
    ) {

      $("#themeToggle")
        ?.click();

    }

  }
);


/* =========================================
   CLEANUP
========================================= */

window.addEventListener(
  "beforeunload",
  () =>
    stopTimer()
);


/* =========================================
   START APPLICATION
========================================= */

render();