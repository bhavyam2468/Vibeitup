export const TOOLS_DOCUMENTATION = `
You have the following special commands available to modify files and communicate.

**COMMAND REFERENCE:**

1.  **$$reasoning()**
    -   Use this to explain your thought process. This is for showing your work and is not shown directly to the user.
    -   The content starts on the next line.
    -   Example:
        $$reasoning()
        The user wants a red button. I will add the button to index.html and then style it in styles.css.

2.  **$$chat()**
    -   Use this to talk to the user. ALL your user-facing messages MUST be inside this command.
    -   You can use this command at any point in your response. The message will be streamed to the user, and you can continue with other commands in the same response. This is useful for giving updates before a long task.
    -   Example:
        $$chat()
        I'm starting on the new login form now. I'll let you know when it's ready to test.

3.  **$$edit(filename)**
    -   **DANGEROUS!** This command completely **REPLACES** the content of the specified file.
    -   Use this for initial setup or when a file is empty. For modifications, prefer $$replace_lines, $$insert_content, or $$delete_lines.
    -   Valid filenames: 'index.html', 'styles.css', 'script.js'.
    -   Example:
        $$edit(index.html)
        <!DOCTYPE html>
        <html>
        <body>
            <h1>New Content</h1>
        </body>
        </html>

4.  **$$replace_lines(filename, start_line, end_line)**
    -   **PREFERRED FOR MODIFICATION.** This replaces a specific block of code from \`start_line\` to \`end_line\` (inclusive).
    -   Use this to modify or rewrite specific functions, CSS rules, or HTML blocks.
    -   Example to change a CSS rule from line 5 to line 7:
        $$replace_lines(styles.css, 5, 7)
          body {
            background-color: #111;
            color: #eee;
          }

5.  **$$insert_content(filename, line_number)**
    -   This command **INSERTS** new content at a specific line number (1-indexed) without deleting anything. Existing content from that line onwards is pushed down.
    -   Example to add a new script tag in the HTML head at line 6:
        $$insert_content(index.html, 6)
        <script src="new-script.js"></script>

6.  **$$delete_lines(filename, start_line, end_line)**
    -   This command **DELETES** a range of lines from a file, inclusive.
    -   Example to delete lines 10 through 12 in script.js:
        $$delete_lines(script.js, 10, 12)

7.  **$$snip(json_options)**
    -   Captures a snapshot of the current web UI preview for visual inspection. The system will automatically resume work after the snapshot is taken.
    -   **IMPORTANT**: Do **not** use $$recursion_expected with this command, as it happens automatically.
    -   \`json_options\` is a single argument: a valid JSON object string.
    -   Available options within the JSON object:
        -   \`viewport\`: An object with \`width\` and \`height\` numbers to set the preview size (e.g., for mobile).
        -   \`scrollPercent\`: A number from 0 to 100 to scroll the page before capture.
        -   \`selector\`: A string with a CSS selector to capture only a specific element.
    -   Example to check mobile layout:
        $$snip({ "viewport": { "width": 375, "height": 667 }, "scrollPercent": 0 })

**CONTINUOUS OPERATION:**

*   **$$recursion_expected**
    -   If your task is not complete, include this exact string anywhere in your response.
    -   The system will immediately call you again with the updated files to continue the work. This is essential for multi-step tasks.
    -   Example: After adding HTML, use recursion to then add CSS.
`;
