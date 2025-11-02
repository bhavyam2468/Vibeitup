# Quick Apps - AI-Powered UI Generator

**Quick Apps** is a sophisticated web application that leverages the Gemini API to autonomously generate and modify web UI code. It provides a seamless development experience where a user can describe an interface or functionality, and the AI will iteratively write the HTML, CSS, and JavaScript to bring it to life.

The core of the application is a powerful, recursive loop that allows the AI to reason about its actions, execute file modifications, observe the results, and correct its own mistakes until the user's request is fully implemented.

## Key Features

- **Autonomous AI Developer:** Give a high-level prompt, and the AI will build a complete, functional applet.
- **Recursive Self-Correction:** The AI analyzes the success or failure of its commands each turn and adjusts its strategy, enabling it to recover from errors.
- **Live Preview:** Instantly see the results of the AI's code changes in a sandboxed iframe.
- **Interactive Chat Interface:** Communicate with the AI, provide new instructions, and receive updates on its progress.
- **Multi-File Editing:** The AI can read and write to `index.html`, `styles.css`, and `script.js`.
- **Transparent Reasoning:** See the AI's thought process before it acts through a dedicated "Reasoning" section.
- **Applet Management:** Create and switch between multiple independent projects (applets).
- **Pre-loaded Libraries:** Comes equipped with popular libraries like Pico.css, Lucide Icons, Chart.js, and more to build rich UIs.
- **Debugging Tools:** Inspect the AI's raw model output and detailed tool execution logs for advanced troubleshooting.

---

## Changelog

-   **New Applet Command:** Added the ability to start a new applet from scratch, clearing the previous state.
-   **`$$title()` Command:** Implemented a command for the AI to set a descriptive title for the applet in its first turn.
-   **Stop Generation Button:** Added a "Stop" button to the UI, allowing the user to gracefully interrupt the AI's generation process at any time.

---

## Example Project Changelog: Pomodoro Timer

This changelog documents the features built by the AI for a "Pomodoro Timer" applet, as detailed in an example development session. It showcases the AI's ability to build a feature-rich application from a simple prompt.

-   **Core Timer Functionality:**
    -   Implemented a fully functional timer with Start, Pause, and Reset controls.
    -   Added support for three modes: Pomodoro, Short Break, and Long Break.
    -   The browser tab's title dynamically updates to reflect the current time.
-   **Smart Features & Automation:**
    -   **Automatic Cycles:** The timer automatically transitions from a work session (Pomodoro) to a break session.
    -   **Long Break Cycle:** After 4 Pomodoros, the timer automatically initiates a Long Break.
    -   **Sound Notifications:** Plays a notification sound using `Howler.js` when each session ends.
    -   **Pomodoro Counter:** A visual counter displays the number of completed Pomodoros in the current cycle.
    -   **Skip Button:** Added a button to skip the current session and move to the next one in the cycle.
-   **Customization & Persistence:**
    -   **Settings Modal:** A comprehensive settings modal allows users to customize the duration for Pomodoro, Short Break, and Long Break sessions.
    -   **Persistent Settings:** User-defined settings are saved to the browser's local storage using `localForage`, so preferences are remembered across visits.
-   **UI/UX & Design:**
    -   Built with a modern, clean, mobile-first dark theme.
    -   Features smooth animations and interactive states for all controls.
    -   Utilizes Lucide Icons for a sharp and consistent visual language.
    -   The entire UI is designed to fit on a standard mobile screen without scrolling.

---

## File Structure

The project is organized into a modular structure to separate concerns like components, services, utilities, and AI-specific logic.

```
.
├── index.html                # The main HTML file for the application shell.
├── index.tsx                 # The entry point for the React application.
├── metadata.json             # Project metadata.
├── README.md                 # This documentation file.
├── constants.ts              # Core constants, initial file content, and the main system prompt.
├── types.ts                  # TypeScript type definitions for the entire application.
│
├── ai/
│   ├── recursion.ts          # Logic to determine if the AI should continue its work loop.
│   └── tools.ts              # Documentation for the AI's available tools and libraries.
│
├── components/
│   ├── AIControlPanel.tsx    # UI for selecting the AI model.
│   ├── ChatMessageItem.tsx   # Renders a single message in the chat history.
│   ├── ChatPanel.tsx         # The main left-side panel for chat and applet management.
│   ├── CodeView.tsx          # Displays code with syntax highlighting.
│   ├── Footer.tsx            # The application footer showing the AI's status.
│   ├── icons.tsx             # A collection of SVG icon components.
│   ├── LogsModal.tsx         # Modal for viewing detailed tool execution logs.
│   ├── MainContent.tsx       # The main right-side panel with the preview and code tabs.
│   ├── PreviewPanel.tsx      # The iframe component that renders the live applet preview.
│   ├── RawOutputModal.tsx    # Modal for viewing the raw text output from the Gemini model.
│   ├── SettingsModal.tsx     # Modal for app settings, API key, and debugging.
│   ├── SnipModal.tsx         # (Not currently used) A modal for capturing screenshots.
│   └── Toast.tsx             # Component for displaying temporary notifications.
│
├── services/
│   └── geminiService.ts      # Handles all communication with the Gemini API.
│
└── utils/
    ├── fileUtils.ts          # Utility for converting files to base64.
    ├── inline-edit.ts        # The core logic for the robust `inline_edit` command.
    ├── parser.ts             # Parses the AI's text response to extract commands.
    └── storage.ts            # Manages saving and loading data from localStorage.
```

---

## Core Concepts

### The AI's Autonomous Loop

The application's primary innovation is its ability to run the AI in a continuous, autonomous loop.

1.  **User Prompt:** The process begins when the user sends an initial prompt (e.g., "Build a pomodoro timer").
2.  **Context Assembly:** The frontend gathers all necessary context for the AI:
    *   The detailed **System Instruction** from `constants.ts`.
    *   The complete, current content of `index.html`, `styles.css`, and `script.js`.
    *   **Observation Logs** detailing the success or failure of every command from the *previous* turn.
    *   The full conversation history.
3.  **API Call:** This context is sent to the Gemini API via `geminiService.ts`.
4.  **Response Parsing:** The application streams the AI's response. `utils/parser.ts` continuously scans this text for special commands (e.g., `$$reasoning`, `$$edit`).
5.  **Command Execution:**
    *   `$$reasoning` and `$$chat` content is displayed in the UI.
    *   `$$edit` and `$$inline_edit` commands are executed, modifying the file content in the application's state. The logic in `utils/inline-edit.ts` is crucial here for handling targeted code changes.
6.  **Logging:** The outcome of each command (success or failure) is recorded in a `TurnLog`. For file commands, this includes detailed error messages if they fail.
7.  **Continuation Check:** The `ai/recursion.ts` module checks if the AI included a `$$task_completed()` command in its response.
    *   **If NOT present:** The loop repeats from Step 2. The critical difference is that the **Observation Logs** from the turn that just finished are now included in the context for the next turn.
    *   **If PRESENT:** The loop terminates, and the AI goes into a "Ready" state, awaiting the next user prompt.

### The Self-Correction Mechanism

This loop enables powerful self-correction. If the AI attempts an `$$inline_edit` that fails (e.g., the code it wants to find is on a different line than it expected), the `performInlineEdit` function generates a highly detailed error message. This message is included in the **Observation Logs** for the next turn.

The AI is explicitly instructed in its system prompt to **review these logs before acting**. This forces it to see its mistake (e.g., "The 'find' block was not found at line 50, but it was found at line 55") and adjust its next command accordingly, making it resilient to failure.

### The Command System

The AI communicates its intentions and actions through a structured command system. All commands are prefixed with `$$` and content-based commands must be terminated with `$$$`.

| Command                                   | Description                                                                                                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`$$reasoning()`**                       | **(Mandatory)** The AI outlines its plan and thought process before taking action. The content is displayed in a collapsible "Reasoning" section in the chat.                                                                                                                                                |
| **`$$chat()`**                            | The AI communicates directly with the user. This is for all user-facing messages, like progress updates or questions.                                                                                                                                                                                     |
| **`$$edit(filename)`**                    | **(Dangerous)** Completely overwrites the entire content of a file. Used sparingly, typically for initial setup. `$$inline_edit` is strongly preferred.                                                                                                                                                      |
| **`$$inline_edit(filename, line_number)`** | **(Primary Tool)** The preferred method for all code modifications. It finds an exact block of code at/near a specific line number and replaces it. This is used for adding, changing, and deleting code. See `utils/inline-edit.ts` for its robust implementation.                                          |
| **`$$task_completed()`**                  | Signals that the AI believes it has fully completed the user's request. This is the **only** command that will stop the autonomous work loop. The AI is instructed not to use this on its first turn to ensure it always reviews its work. |

---

## Component Breakdown

-   **`App.tsx`**: The root component. It manages all major state, including applets, file content, chat history, and the main AI processing logic (`processAndRunGemini`).
-   **`ChatPanel.tsx`**: The left sidebar that contains the chat history, the user input form, and the applet management dropdown.
-   **`MainContent.tsx`**: The right-hand panel that acts as a container for the tabbed view (`Preview`, `index.html`, etc.).
-   **`PreviewPanel.tsx`**: Renders the live applet inside a sandboxed `<iframe>`. It dynamically constructs the `srcDoc` by injecting the CSS and JS content into the HTML.
-   **`CodeView.tsx`**: Uses `react-syntax-highlighter` to provide a read-only view of the code for each file.
-   **Modals (`SettingsModal`, `LogsModal`, `RawOutputModal`)**: Provide UI for settings, API key management, and essential debugging views into the AI's operations.

## Available Libraries

The AI has been informed that the following libraries are pre-loaded in the preview environment and can be used immediately in `script.js` without any import statements.

-   **Pico CSS:** For clean, semantic, and class-less styling.
-   **Lucide Icons:** For a wide range of sharp, consistent SVG icons.
-   **Animate.css:** For easy-to-use CSS animations.
-   **Chart.js:** For powerful data visualization and charting.
-   **Day.js:** For lightweight date and time manipulation.
-   **Howler.js:** For advanced audio playback.
-   **localForage:** For robust, asynchronous browser storage (preferred over `localStorage`).

---

## How to Use

1.  **Start a Conversation:** Open the app and type a prompt into the chat box, describing the web application you want to build. Be as descriptive as possible.
2.  **Watch the AI Work:** The AI will begin its work loop. You will see its reasoning, the tools it uses, and messages in the chat panel. The live preview on the right will update as the AI commits changes to the files.
3.  **Iterate and Refine:** If the AI's first version isn't perfect, provide a follow-up prompt. For example, "Change the primary color to orange" or "Add a confirmation step before deleting an item."
4.  **Manage Applets:** Use the dropdown at the top of the chat panel to create new, independent applets or switch between existing ones.
5.  **Settings (Optional):** Click the settings icon to add your own Gemini API key for improved performance and higher rate limits. You can also reset the current applet to its initial state from here.