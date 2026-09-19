# FocusList

### Plan less. Focus more.

FocusList is a distraction-free productivity workspace designed to help users organize tasks, focus on important work, and understand their productivity patterns.

Instead of being just another to-do list, FocusList combines task management, daily planning, focused work sessions, and productivity insights in one simple interface.

---

##  Features

### 📋 Smart Task Management
- Create and manage tasks
- Priority levels: High, Medium and Low
- Due dates
- Estimated completion time
- Projects / tags
- Task notes
- Edit and delete tasks
- Mark tasks as completed
- Drag and drop task ordering

###  Daily Planning
- Set a personal daily task target
- Visual completion progress
- Daily completion percentage
- Open task counter
- Productive-day streak

###  Focus Mode
FocusList includes a dedicated focus workspace.

Users can:
- Select a task
- Start a focused work session
- Choose 15, 25 or 45 minute sessions
- Pause or reset the timer
- Automatically record completed focus sessions

###  Productivity Insights
The analytics section provides:
- 7-day task completion history
- Weekly focus time
- Priority breakdown
- Completed task count
- High-priority completion rate
- Average task estimate

###  Search & Organization
- Search tasks, notes and projects
- Filter by status
- Filter by priority
- Sort by smart order, due date, priority or creation time
- Dedicated inbox for unscheduled tasks

###  Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `N` | New task |
| `F` | Focus mode |
| `/` | Search |
| `1` | Today |
| `2` | Inbox |
| `4` | Insights |
| `T` | Toggle theme |
| `Ctrl/Cmd + K` | Command palette |

---

##  UI / UX

FocusList uses a minimal interface designed around reducing visual distraction.

The interface includes:

- Responsive desktop layout
- Mobile-friendly interface
- Light and dark themes
- Clear visual hierarchy
- Progress indicators
- Focused task cards
- Keyboard navigation
- Visible focus states
- Reduced-motion support

---

##  Accessibility

FocusList includes several accessibility-focused features:

- Semantic HTML
- Accessible labels
- Keyboard shortcuts
- Skip navigation link
- Visible focus indicators
- ARIA labels where appropriate
- Reduced-motion support
- Live regions for dynamic updates

---

##  Performance

FocusList is built using lightweight web technologies without a large frontend framework.

The application uses:

- Vanilla JavaScript
- Modular ES6 JavaScript
- CSS
- Local browser storage
- Lightweight DOM rendering

This keeps the application simple and fast.

---

##  Project Architecture

```text
focuslist/
│
├── index.html
├── styles.css
├── manifest.webmanifest
├── sw.js
│
└── js/
    ├── app.js
    ├── storage.js
    ├── analytics.js
    └── ui.js
