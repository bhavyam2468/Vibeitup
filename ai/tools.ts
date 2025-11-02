export const TOOLS_DOCUMENTATION = `
**AVAILABLE LIBRARIES:**
You have the following third-party libraries pre-loaded and ready to use in \`index.html\`.

*   **Pico CSS:** A class-less CSS framework for clean, modern styles.
    *   **Usage:** Write semantic HTML (\`<main>\`, \`<article>\`, \`<nav>\`). Pico styles it automatically.
    *   **Dark Mode:** Toggle dark mode by changing the \`data-theme\` attribute on the \`<html>\` tag (e.g., \`document.documentElement.dataset.theme = 'dark'\`). The default is 'dark'.
    *   **Avoid:** Writing basic CSS for layout, buttons, forms, etc. Rely on Pico first.

*   **Lucide Icons:** A clean and consistent icon library.
    *   **Usage:** Use \`<i data-lucide="[icon-name]"></i>\`. For example, \`<i data-lucide="settings"></i>\`.
    *   **IMPORTANT:** After adding new icons to the DOM, you MUST call \`lucide.createIcons();\` in your JavaScript to render them.
    *   **Find icons at:** https://lucide.dev/icons/
    *   **Avoid:** Using text-based emojis for icons.

*   **Animate.css:** For adding CSS animations.
    *   **Usage:** Add the required classes to your HTML elements. Example: \`<h1 class="animate__animated animate__bounce">An animated heading</h1>\`.

*   **Chart.js:** For creating charts and data visualizations.
    *   **Usage:** Create a \`<canvas id="myChart"></canvas>\` in HTML. Then, in JavaScript:
        {/* FIX: The original backticks were breaking the template literal. Replaced with a markdown code block. */}
        \`\`\`javascript
        const ctx = document.getElementById('myChart').getContext('2d');
        new Chart(ctx, { type: 'bar', data: {...} });
        \`\`\`

*   **Day.js:** A lightweight library for handling dates and times.
    *   **Usage:** The \`dayjs\` function is available globally. Example: \`dayjs().format('MMMM D, YYYY');\`.

*   **Howler.js:** An audio library for playing sounds.
    *   **Usage:** \`const sound = new Howl({ src: ['sound.mp3'] }); sound.play();\`
    *   **Note:** Use publicly available, royalty-free sound URLs.

*   **localForage:** A better, asynchronous library for storing data in the browser.
    *   **Usage:** \`localforage.setItem('key', 'value').then(...);\` and \`localforage.getItem('key').then(value => ...);\`.
    *   **Prefer this over:** \`localStorage\`.

You have the following special commands available to modify files and communicate.

**CRITICAL RULE: You MUST end every command that has a content block with \`$$$\` on a new line.**
This applies to: \`$$reasoning\`, \`$$chat\`, \`$$edit\`, and \`$$inline_edit\`.
Failure to do so will cause the system to fail.

**COMMAND REFERENCE:**

1.  **$$reasoning()**
    -   Explain your thought process before you act. This is mandatory.
    -   Example:
        $$reasoning()
        The user wants a red button. I will use $$inline_edit to change the background color in styles.css.
        $$$

2.  **$$chat()**
    -   Talk to the user. ALL user-facing messages MUST use this command.
    -   Example:
        $$chat()
        I'm starting on the new login form now.
        $$$

3.  **$$edit(filename)**
    -   **DANGEROUS!** Completely **REPLACES** the file's content. Use with extreme caution. Prefer \`$$inline_edit\` for all modifications.
    -   Valid filenames: 'index.html', 'styles.css', 'script.js'.
    -   Example:
        $$edit(index.html)
        <!DOCTYPE html>
        <html>
        <body><h1>New Content</h1></body>
        </html>
        $$$

4.  **$$inline_edit(filename, line_number)**
    -   **YOUR PRIMARY TOOL FOR ALL CODE MODIFICATIONS.** This command finds and replaces a specific block of code. Mastering it is the key to success.

    -   **How It Works:**
        1.  The system looks for the exact text in your \`[[find]]\` block.
        2.  It starts searching at the \`line_number\` you provide, with a small tolerance (+/- 2 lines).
        3.  **NEW:** If it can't find a match there, it will search the *entire file*. If it finds exactly ONE other match, it will **automatically use it** and succeed.
        4.  If it finds multiple matches or no matches, it will fail and you MUST correct your command on the next turn.

    -   **Syntax:**
        $$inline_edit(filename, line_number)
        [[find]]
        (The exact code you want to find and replace)
        [[replace]]
        (The new code you want to insert. Leave empty to delete.)
        [[end]]
        $$$

    -   **BEST PRACTICES FOR AVOIDING FAILURE:**
        *   **Use Context in \`[[find]]\`:** Do not just find the one line you want to change. Include one or two lines *before and after* it that are NOT changing. This creates a unique "anchor" for your edit and dramatically reduces failures.
            -   **BAD \`[[find]]\` (Fragile):**
                \`\`\`
                [[find]]
                <h1>Hello, World!</h1>
                \`\`\`
            -   **GOOD \`[[find]]\` (Robust):**
                \`\`\`
                [[find]]
    <main class="container">
        <h1>Hello, World!</h1>
        <p>Start by telling me what to build.</p>
    </main>
                \`\`\`
        *   **Verify Line Numbers:** Before you write your command, look at the file content provided in the prompt and double-check the line numbers.
        *   **Order Multiple Edits:** When editing the same file multiple times in one turn, ALWAYS go from the highest line number to the lowest (bottom-to-top).

    -   **HOW TO RECOVER FROM ERRORS:**
        *   If a command fails, the **OBSERVATION LOG** will tell you why. READ IT CAREFULLY.
        *   If it says \`The 'find' block was not found at or near the specified line number...\`, it means your \`[[find]]\` block or \`line_number\` is wrong.
        *   The log will show you the code around your target line. Use this snippet to create a correct, robust \`[[find]]\` block.
        *   If the log says \`The 'find' block is ambiguous and was found at these other lines: X, Y\`, it means your \`[[find]]\` block is not unique. Make it more specific by adding more context, and use the correct line number (X or Y).

5.  **$$title("new_name")**
    -   Sets or changes the name of the current applet.
    -   **MANDATORY:** You MUST use this command on your first turn to give the applet a descriptive name based on the user's request.
    -   Example:
        $$title("Interactive Weather Dashboard")

**ERROR CORRECTION AND CONTINUOUS OPERATION:**

*   **Error Feedback:** If your \`$$inline_edit\` command fails (e.g., the code in your \`[[find]]\` block is not at the specified line number), the system will provide an \`OBSERVATION\` log on your next turn. This log will contain:
    1.  The reason for the failure.
    2.  The actual code around your target line number.
    3.  A list of other lines where your \`[[find]]\` block *does* exist, if any.
    **You MUST use this information to correct your next command.**

*   **$$task_completed()**
    -   Use this command ONLY when the user's entire request is finished. It takes no arguments.
    -   This signals that the recursive loop should stop.
`;