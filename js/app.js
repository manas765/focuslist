import {
  loadState,
  saveState
} from "./storage.js";

import {
  renderTaskList,
  renderStats,
  renderAnalytics
} from "./ui.js";


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

  seconds:1500,

  running:false,

  interval:null,

  minutes:25

};


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


function uid() {

  return `
    ${Date.now()}-
    ${Math.random()
      .toString(16)
      .slice(2)}
  `;

}


function today() {

  return new Date()
    .toISOString()
    .slice(0,10);

}


function save() {

  saveState(state);

  render();

}


function showToast(message) {

  const element =
    $("#toast");

  element.textContent =
    message;

  element.classList.add(
    "show"
  );

  clearTimeout(
    showToast.t
  );

  showToast.t =
    setTimeout(
      () => {
        element.classList.remove(
          "show"
        );
      },
      2200
    );
}


function matches(task) {

  if (
    currentFilter === "active" &&
    task.completed
  ) {
    return false;
  }


  if (
    currentFilter === "completed" &&
    !task.completed
  ) {
    return false;
  }


  if (
    currentFilter === "high" &&
    task.priority !== "high"
  ) {
    return false;
  }


  if (search) {

    const hay =
      `
        ${task.title}
        ${task.notes || ""}
        ${task.project || ""}
      `.toLowerCase();


    if (
      !hay.includes(
        search.toLowerCase()
      )
    ) {
      return false;
    }

  }


  return true;
}


function sortTasks(tasks) {

  const rank = {

    high:0,

    medium:1,

    low:2

  };


  return [...tasks].sort(
    (a,b) => {

      if (
        sort === "priority"
      ) {
        return (
          rank[a.priority] -
          rank[b.priority]
        );
      }


      if (
        sort === "created"
      ) {
        return b.createdAt.localeCompare(
          a.createdAt
        );
      }


      if (
        sort === "due"
      ) {

        return (
          (a.dueAt || "9999")
            .localeCompare(
              b.dueAt || "9999"
            )
        );

      }


      if (
        a.completed !==
        b.completed
      ) {

        return (
          Number(a.completed) -
          Number(b.completed)
        );

      }


      if (
        a.dueAt !==
        b.dueAt
      ) {

        return (
          (a.dueAt || "9999")
            .localeCompare(
              b.dueAt || "9999"
            )
        );

      }


      return (
        rank[a.priority] -
        rank[b.priority]
      );

    }
  );
}


function taskById(id) {

  return state.tasks.find(
    task =>
      task.id === id
  );

}


/* ADD TASK */

function addTask(e) {

  e.preventDefault();


  const title =
    $("#taskTitle")
      .value
      .trim();


  if (!title) {
    return;
  }


  state.tasks.unshift({

    id:
      uid(),

    title,

    priority:
      $("#taskPriority").value,

    dueAt:
      $("#taskDue").value || "",

    estimate:
      Number(
        $("#taskEstimate").value
      ) || 25,

    project:
      $("#taskProject")
        .value
        .trim(),

    notes:
      $("#taskNotes")
        .value
        .trim(),

    completed:false,

    createdAt:
      new Date().toISOString(),

    completedDate:""

  });


  e.target.reset();


  $("#taskPriority").value =
    "medium";


  $("#taskEstimate").value =
    25;


  save();


  showToast(
    "Task added"
  );

}


/* TOGGLE TASK */

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


/* EDIT */

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


  task.title =
    title.trim() ||
    task.title;


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

}


/* DELETE */

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


  save();


  showToast(
    `Deleted "${removed.title}"`
  );

}


/* FOCUS */

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

}


/* REORDER */

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


  const a =
    state.tasks.findIndex(
      task =>
        task.id === from
    );


  const b =
    state.tasks.findIndex(
      task =>
        task.id === to
    );


  if (
    a < 0 ||
    b < 0
  ) {
    return;
  }


  const [
    item
  ] =
    state.tasks.splice(
      a,
      1
    );


  state.tasks.splice(
    b,
    0,
    item
  );


  save();

}


/* RENDER TASKS */

function renderTasks() {

  const list =
    sortTasks(
      state.tasks.filter(
        matches
      )
    );


  renderTaskList(
    $("#taskList"),
    list,

    {
      toggle:toggleTask,
      edit:editTask,
      delete:deleteTask,
      focus:focusOn,
      reorder
    }
  );


  const inbox =
    state.tasks.filter(
      task =>
        !task.dueAt &&
        !task.completed
    );


  renderTaskList(
    $("#inboxList"),
    inbox,

    {
      toggle:toggleTask,
      edit:editTask,
      delete:deleteTask,
      focus:focusOn,
      reorder
    },

    "Your inbox is clear."
  );


  const queue =
    state.tasks
      .filter(
        task =>
          !task.completed
      )
      .slice(0,5);


  $("#focusQueue").innerHTML =
    queue.length

      ? queue.map(
          task => `

            <div class="queue-item">

              <button
                data-queue="${task.id}"
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
        ).join("")

      : `
          <div class="empty">
            No open tasks.
          </div>
        `;


  $$(
    "#focusQueue [data-queue]"
  ).forEach(
    button => {

      button.onclick =
        () =>
          focusOn(
            button.dataset.queue
          );

    }
  );

}


function escapeText(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      char =>
        ({
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#039;"
        }[char])
    );

}


/* FOCUS VIEW */

function renderFocus() {

  const task =
    taskById(
      focusTaskId
    );


  $("#focusTaskName")
    .textContent =
      task
        ? task.title
        : "Pick a task to begin.";


  $("#focusTaskMeta")
    .textContent =

      task

        ? `
          ${task.priority} priority ·
          ${task.estimate || 25} min estimate
          ${
            task.project
              ? ` · ${task.project}`
              : ""
          }
        `

        : `
          A focused session turns
          an intention into measurable progress.
        `;
}


/* VIEWS */

function renderView() {

  $$(
    "#dashboardView,#focusView,#analyticsView,#inboxView"
  ).forEach(
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


  $(
    viewMap[currentView]
  ).classList.remove(
    "hidden"
  );


  $$(".nav-item")
    .forEach(
      button => {

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

      }
    );


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


  $("#viewEyebrow")
    .textContent =
      titles[currentView][0];


  $("#viewTitle")
    .textContent =
      titles[currentView][1];


  $("#viewSubtitle")
    .textContent =
      titles[currentView][2];


  renderFocus();

}


/* MAIN RENDER */

function render() {

  renderStats(
    state
  );

  renderTasks();

  renderAnalytics(
    state
  );

  renderView();

  applyTheme();

  updateTimerUI();

}


/* THEME */

function applyTheme() {

  document.documentElement.dataset.theme =
    state.theme === "dark"
      ? "dark"
      : "light";


  $("#themeIcon")
    .textContent =
      state.theme === "dark"
        ? "☀"
        : "☾";

}


function setView(view) {

  currentView =
    view;

  render();

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

}


/* TIMER */

function setTimer(minutes) {

  stopTimer();

  timer.minutes =
    minutes;

  timer.seconds =
    minutes * 60;

  updateTimerUI();


  $$(".timer-options button")
    .forEach(
      button => {

        button.classList.toggle(
          "selected",
          Number(
            button.dataset.minutes
          ) === minutes
        );

      }
    );

}


function updateTimerUI() {

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


  $("#timerDisplay")
    .textContent =
      `${minutes}:${seconds}`;


  $("#timerStart")
    .textContent =
      timer.running
        ? "Pause session"
        : "Start session";

}


function stopTimer() {

  if (
    timer.interval
  ) {

    clearInterval(
      timer.interval
    );

  }


  timer.interval =
    null;

  timer.running =
    false;

  updateTimerUI();

}


function startTimer() {

  if (timer.running) {

    stopTimer();

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


          const task =
            taskById(
              focusTaskId
            );


          const mins =
            timer.minutes;


          state.sessions.push({

            id:
              uid(),

            date:
              new Date().toISOString(),

            minutes:
              mins,

            taskId:
              focusTaskId || ""

          });


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


          setTimer(25);

        }

      },
      1000
    );

}


/* COMMAND PALETTE */

function openCommands() {

  const dialog =
    $("#commandDialog");


  $("#commandInput")
    .value = "";


  renderCommands("");


  dialog.showModal();


  setTimeout(
    () =>
      $("#commandInput")
        .focus(),
    0
  );

}


function renderCommands(q) {

  const commands = [

    [
      "New task",
      "N",
      () => {

        setView("today");

        $("#taskTitle")
          .focus();

      }
    ],

    [
      "Focus mode",
      "F",
      () =>
        setView("focus")
    ],

    [
      "Insights",
      "4",
      () =>
        setView("analytics")
    ],

    [
      "Show inbox",
      "2",
      () =>
        setView("inbox")
    ],

    [
      "Toggle theme",
      "T",
      () =>
        $("#themeToggle").click()
    ],

    [
      "Clear completed",
      "",
      () =>
        $("#clearCompleted").click()
    ]

  ].filter(
    command =>
      command[0]
        .toLowerCase()
        .includes(
          q.toLowerCase()
        )
  );


  $("#commandList")
    .innerHTML =

      commands
        .map(
          (command,index) => `

            <button
              class="command-item"
              data-command="${index}"
            >

              <span>
                ${command[0]}
              </span>

              <small>
                ${command[1]}
              </small>

            </button>

          `
        )
        .join("");


  $$(
    "#commandList [data-command]"
  ).forEach(
    button => {

      button.onclick =
        () => {

          commands[
            Number(
              button.dataset.command
            )
          ][2]();

          $("#commandDialog")
            .close();

        };

    }
  );

}


/* EVENT LISTENERS */

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
  .forEach(
    button => {

      button.onclick =
        () =>
          setView(
            button.dataset.view
          );

    }
  );


$$(".filter-link")
  .forEach(
    button => {

      button.onclick =
        () => {

          currentFilter =
            button.dataset.filter;

          $("#statusSelect")
            .value =
              currentFilter;

          setView("today");

          renderTasks();

        };

    }
  );


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
      setView("focus");


$("#backToToday")
  .onclick =
    () =>
      setView("today");


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
  .forEach(
    button => {

      button.onclick =
        () =>
          setTimer(
            Number(
              button.dataset.minutes
            )
          );

    }
  );


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
              $("#targetInput").value
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


/* KEYBOARD SHORTCUTS */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      if (
        $("#commandDialog").open
      ) {

        $("#commandDialog")
          .close();

      }

      return;
    }


    if (
      (event.ctrlKey ||
       event.metaKey) &&
      event.key.toLowerCase() === "k"
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
        document.activeElement.tagName
      )
    ) {
      return;
    }


    if (
      event.key === "/"
    ) {

      event.preventDefault();

      setView("today");

      $("#searchInput")
        .focus();

    }


    if (
      event.key.toLowerCase() === "n"
    ) {

      event.preventDefault();

      setView("today");

      $("#taskTitle")
        .focus();

    }


    if (
      event.key.toLowerCase() === "f"
    ) {

      event.preventDefault();

      setView("focus");

    }


    if (
      event.key === "1"
    ) {
      setView("today");
    }


    if (
      event.key === "2"
    ) {
      setView("inbox");
    }


    if (
      event.key === "4"
    ) {
      setView("analytics");
    }


    if (
      event.key.toLowerCase() === "t"
    ) {

      $("#themeToggle")
        .click();

    }

  }
);


window.addEventListener(
  "beforeunload",
  () =>
    stopTimer()
);


/* START */

render();