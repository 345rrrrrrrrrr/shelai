import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function isCommandSafe(command: string): boolean {
  // All commands are now allowed - no restrictions
  return true;
}

export async function executeShellCommand(command: string, workingDir: string = "/home/runner/workspace"): Promise<ShellResult> {
  // Security restrictions removed - all commands allowed

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir,
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    });

    return {
      stdout: stdout.toString(),
      stderr: stderr.toString(),
      exitCode: 0
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || error.message,
      exitCode: error.code || 1
    };
  }
}

export async function downloadFile(url: string, destination: string): Promise<ShellResult> {
  const command = `curl -L "${url}" -o "${destination}"`;
  return executeShellCommand(command);
}

export function getCurrentDirectory(): string {
  return process.cwd();
}

export function getWorkspaceDirectory(): string {
  return "/home/runner/workspace";
}

export function changeDirectory(newDir: string): boolean {
  try {
    const resolvedPath = path.resolve(newDir);
    process.chdir(resolvedPath);
    return true;
  } catch (error) {
    return false;
  }
}
