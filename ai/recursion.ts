import type { Command } from '../types';

export function shouldContinueAfterTurn(
    commands: Command[]
): boolean {
    const hasTaskCompleted = commands.some(c => c.name === 'task_completed');
    
    // In the simplified continuous mode, the AI works until it explicitly signals completion.
    // This trusts the AI to manage the workflow and prevents premature termination of multi-step tasks.
    return !hasTaskCompleted;
}
