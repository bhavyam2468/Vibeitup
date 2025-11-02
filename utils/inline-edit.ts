import type { FileName } from '../types';

/**
 * Normalizes a block of code for comparison.
 * - Trims whitespace from each line.
 * - Filters out empty lines.
 * This makes the comparison robust against formatting differences.
 */
const normalizeBlock = (block: string): string => {
    return block
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
};

interface InlineEditResult {
    success: boolean;
    newContent?: string;
    errorLog?: string;
}

/**
 * Performs a find-and-replace operation on a file's content. It first searches
 * for the 'find' block within a tolerance window (+/- 2 lines) of the specified
 * lineNumber. If not found, it searches the entire file for a single unique match
 * and uses that as a fallback. If the match is still not found or is ambiguous,
 * it generates a detailed error log to help the AI self-correct.
 */
export function performInlineEdit(
    fileName: FileName,
    fileContent: string,
    lineNumber: number,
    findBlock: string,
    replaceBlock: string
): InlineEditResult {
    const fileLines = fileContent.split('\n');
    const targetLineIndex = lineNumber - 1;

    if (targetLineIndex < 0 || targetLineIndex >= fileLines.length) {
        return {
            success: false,
            errorLog: `Inline edit failed on ${fileName}: Line number ${lineNumber} is out of bounds. The file has ${fileLines.length} lines.`,
        };
    }

    const findBlockLines = findBlock.split('\n');
    const normalizedFind = normalizeBlock(findBlock);

    // If find block is empty, it can't be matched.
    if (!normalizedFind) {
         return {
            success: false,
            errorLog: `Inline edit failed on ${fileName}: The 'find' block cannot be empty.`,
        };
    }

    const SEARCH_TOLERANCE = 2;
    let actualMatchIndex: number | null = null;

    const searchStartIndex = Math.max(0, targetLineIndex - SEARCH_TOLERANCE);
    const searchEndIndex = Math.min(fileLines.length - findBlockLines.length + 1, targetLineIndex + SEARCH_TOLERANCE + 1);
    
    for (let i = searchStartIndex; i < searchEndIndex; i++) {
        const fileBlockToCompare = fileLines.slice(i, i + findBlockLines.length).join('\n');
        if (normalizeBlock(fileBlockToCompare) === normalizedFind) {
            actualMatchIndex = i;
            break; // Found a match, stop searching
        }
    }

    // If a match was found within the tolerance window, perform the replacement.
    if (actualMatchIndex !== null) {
        const before = fileLines.slice(0, actualMatchIndex);
        const after = fileLines.slice(actualMatchIndex + findBlockLines.length);
        const replaceLines = replaceBlock.length > 0 ? replaceBlock.split('\n') : [];
        const newContent = [...before, ...replaceLines, ...after].join('\n');
        return { success: true, newContent };
    }

    // --- No match in tolerance window, search the entire file for a unique alternative ---
    const alternativeMatches: number[] = [];
    for (let i = 0; i <= fileLines.length - findBlockLines.length; i++) {
        const sliceToCheck = fileLines.slice(i, i + findBlockLines.length).join('\n');
        if (normalizeBlock(sliceToCheck) === normalizedFind) {
            alternativeMatches.push(i);
        }
    }

    // If exactly one unique alternative is found, use it automatically.
    if (alternativeMatches.length === 1) {
        const correctedMatchIndex = alternativeMatches[0];
        const before = fileLines.slice(0, correctedMatchIndex);
        const after = fileLines.slice(correctedMatchIndex + findBlockLines.length);
        const replaceLines = replaceBlock.length > 0 ? replaceBlock.split('\n') : [];
        const newContent = [...before, ...replaceLines, ...after].join('\n');
        // The correction is applied silently to reduce a failure turn. The AI will get a success log.
        return { success: true, newContent };
    }

    // --- If no unique match found, proceed to detailed error reporting ---
    const errorLogParts: string[] = [];
    errorLogParts.push(`Inline edit failed on ${fileName}: The 'find' block was not found at or near the specified line number (${lineNumber} +/- ${SEARCH_TOLERANCE} lines).`);

    const contextStart = Math.max(0, targetLineIndex - 5);
    const contextEnd = Math.min(fileLines.length, targetLineIndex + 6);
    const contextSnippet = fileLines
        .slice(contextStart, contextEnd)
        .map((line, i) => `${contextStart + i + 1}: ${line}`)
        .join('\n');
    errorLogParts.push(`\n--- Code at target line ${lineNumber} (+/- 5 lines) ---\n${contextSnippet}\n---`);

    if (alternativeMatches.length > 1) {
        const alternativeLines = alternativeMatches.map(i => i + 1);
        errorLogParts.push(`The 'find' block is ambiguous and was found at these other lines: ${alternativeLines.join(', ')}. Please provide a more specific line number or find block.`);
    } else { // alternativeMatches.length === 0
        errorLogParts.push("The 'find' block was not found anywhere else in the file.");
    }
    
    return { success: false, errorLog: errorLogParts.join('\n') };
}