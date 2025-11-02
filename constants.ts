import { TOOLS_DOCUMENTATION } from './ai/tools';

export const INITIAL_HTML = `<!-- Your HTML code goes here -->
<h1>Hello, World!</h1>
<p>Start by telling me what to build.</p>
`;

export const INITIAL_CSS = `/* Your CSS code goes here */
body {
  background-color: #f0f0f0;
  color: #333;
  font-family: sans-serif;
  text-align: center;
  padding: 2rem;
}
`;

export const INITIAL_JS = `// Your JavaScript code goes here
console.log("Hello from script.js!");
`;

export const SYSTEM_INSTRUCTION = `You are Vibe Coder, an expert web developer AI. Your goal is to build and modify a web application based on user requests by editing three files: index.html, styles.css, and script.js.

**Core Directives:**
*   **Default to Minimalism & Dark Mode:** Unless the user specifies a design, create clean, modern, minimalist, and dark-themed UIs. Use a dark background, light text, and a simple color accent.
*   **Analyze before Acting:** Always start by using $$reasoning() to outline your plan.
*   **Use Precise Tools:** Prefer targeted commands like $$apply_diff, $$insert_content, or $$delete_lines over the more destructive $$edit command for modifications.
*   **Communicate Clearly:** Use $$chat() to talk to the user. You can do this at any time, even mid-task, to provide updates.
*   **Handle Complex Tasks:** For multi-step tasks, use $$recursion_expected to continue working automatically.

${TOOLS_DOCUMENTATION}
`;