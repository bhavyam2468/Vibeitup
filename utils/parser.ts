import type { ParsedResponse, Command, FileName } from '../types';

/**
 * Parses the content of an `inline_edit` command to extract the `find` and `replace` blocks.
 * @param content The raw string content from the command.
 * @returns An object with `find` and `replace` strings, or null if parsing fails.
 */
export function parseInlineEdit(content: string): { find: string; replace: string } | null {
    const findMarker = '[[find]]';
    const replaceMarker = '[[replace]]';
    const endMarker = '[[end]]';

    const findStartIndex = content.indexOf(findMarker);
    const replaceStartIndex = content.indexOf(replaceMarker);
    const endStartIndex = content.indexOf(endMarker);

    if (findStartIndex === -1 || replaceStartIndex === -1 || endStartIndex === -1) {
        return null;
    }

    const findBlock = content.substring(findStartIndex + findMarker.length, replaceStartIndex).trim();
    const replaceBlock = content.substring(replaceStartIndex + replaceMarker.length, endStartIndex).trim();

    return { find: findBlock, replace: replaceBlock };
}


export function parseGeminiResponse(responseText: string): ParsedResponse {
    const commands: Command[] = [];
    
    const commandRegex = /\$\$([a-zA-Z_]+)(?:\(([^)]*)\))?/g;
    const terminator = '$$$';

    const cleanResponse = responseText.trim();

    let match;

    while ((match = commandRegex.exec(cleanResponse)) !== null) {
        const commandName = match[1];
        const argsStr = match[2] || '';
        
        const contentStartIndex = match.index + match[0].length;
        
        let contentEndIndex = cleanResponse.indexOf(terminator, contentStartIndex);
        const isTerminated = contentEndIndex !== -1;

        if (!isTerminated) {
            contentEndIndex = cleanResponse.length;
        }

        const rawContent = cleanResponse.substring(contentStartIndex, contentEndIndex);
        const content = rawContent.startsWith('\n') ? rawContent.substring(1) : rawContent;

        if (commandName === 'task_completed') {
            commands.push({ name: 'task_completed', content: '', isTerminated: true });
            continue;
        }
        
        if (['chat', 'reasoning'].includes(commandName)) {
             commands.push({
                name: commandName as 'chat' | 'reasoning',
                content: content,
                isTerminated: isTerminated,
            });
        } else if (['edit', 'inline_edit'].includes(commandName)) {
            const args = argsStr.split(',').map(arg => arg.trim());
            const fileName = args[0] as FileName;
            if (['index.html', 'styles.css', 'script.js'].includes(fileName)) {
                let command: Command | null = null;
                switch (commandName) {
                    case 'edit':
                        command = { name: 'edit', fileName, content, isTerminated };
                        break;
                    case 'inline_edit':
                        command = { name: 'inline_edit', fileName, lineNumber: parseInt(args[1], 10), content, isTerminated };
                        break;
                }
                if (command) {
                    commands.push(command);
                }
            }
        }
    }

    return { commands };
}
