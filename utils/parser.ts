import type { ParsedResponse, Command, FileName, SnipOptions } from '../types';

export function parseGeminiResponse(responseText: string): ParsedResponse {
    const commands: Command[] = [];
    let lastIndex = 0;

    const commandRegex = /\$\$([a-zA-Z_]+)(?:\(([^)]*)\))?\n/g;
    const recursionRegex = /\$\$recursion_expected/;

    const recursionExpected = recursionRegex.test(responseText);
    const cleanResponse = responseText.replace(recursionRegex, '').trim();

    let match;
    while ((match = commandRegex.exec(cleanResponse)) !== null) {
        const commandName = match[1];
        const argsStr = match[2] || '';
        const commandContentStartIndex = match.index + match[0].length;

        const nextCommandMatch = commandRegex.exec(cleanResponse);
        const commandContentEndIndex = nextCommandMatch ? nextCommandMatch.index : cleanResponse.length;
        
        commandRegex.lastIndex = nextCommandMatch ? nextCommandMatch.index : cleanResponse.length;

        const content = cleanResponse.substring(commandContentStartIndex, commandContentEndIndex).trimEnd();
        
        if (commandName === 'chat' || commandName === 'reasoning') {
             commands.push({
                name: commandName,
                content: content,
            });
        } else if (commandName === 'snip') {
            try {
                const options: SnipOptions = JSON.parse(argsStr || '{}');
                 commands.push({
                    name: 'snip',
                    snipOptions: options,
                    content: '', // snip has no content block
                });
            } catch (e) {
                console.error("Failed to parse $$snip options:", argsStr, e);
            }
        } else if (['edit', 'replace_lines', 'insert_content', 'delete_lines'].includes(commandName)) {
            const args = argsStr.split(',').map(arg => arg.trim());
            const fileName = args[0] as FileName;
            if (['index.html', 'styles.css', 'script.js'].includes(fileName)) {
                let command: Command | null = null;
                switch (commandName) {
                    case 'edit':
                        command = {
                            name: commandName,
                            fileName: fileName,
                            content: content,
                        };
                        break;
                    case 'insert_content':
                        command = {
                            name: commandName,
                            fileName: fileName,
                            lineNumber: parseInt(args[1], 10),
                            content: content,
                        };
                        break;
                    case 'replace_lines':
                        command = {
                            name: 'replace_lines',
                            fileName: fileName,
                            startLine: parseInt(args[1], 10),
                            endLine: parseInt(args[2], 10),
                            content: content,
                        };
                        break;
                    case 'delete_lines':
                        command = {
                            name: 'delete_lines',
                            fileName: fileName,
                            startLine: parseInt(args[1], 10),
                            endLine: parseInt(args[2], 10),
                            content: '', // No content for delete
                        };
                        break;
                }
                if (command) {
                    commands.push(command);
                }
            }
        }
        
        lastIndex = commandContentEndIndex;
        if (nextCommandMatch) {
             commandRegex.lastIndex = nextCommandMatch.index;
        } else {
             break;
        }
    }

    return { commands, recursionExpected };
}
