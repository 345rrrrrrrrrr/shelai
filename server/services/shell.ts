import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const DANGEROUS_COMMANDS = [
  "rm -rf /",
  ":(){ :|:& };:",
  "chmod -R 777 /",
  "dd if=/dev/zero of=/dev/sda",
  "mkfs",
  "fdisk",
  "shutdown",
  "reboot",
  "halt",
  "poweroff"
];

const ALLOWED_COMMANDS = [
  "ls", "cat", "pwd", "echo", "grep", "find", "head", "tail", "sort", "wc",
  "touch", "mkdir", "cp", "mv", "rm", "chmod", "chown", "git", "npm", "node",
  "python", "python3", "pip", "curl", "wget", "tar", "gzip", "gunzip", "zip", "unzip"
];

export function isCommandSafe(command: string): boolean {
  // Check for dangerous commands
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (command.includes(dangerous)) {
      return false;
    }
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /rm\s+.*-rf/,
    /chmod\s+.*777/,
    />/,  // Redirect that might overwrite important files
    /\|/,  // Pipes that might be used maliciously
    /sudo/,
    /su\s/,
    /passwd/,
    /useradd/,
    /userdel/,
    /systemctl/,
    /service/
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return false;
    }
  }

  // Check if command starts with an allowed command
  const firstWord = command.split(" ")[0];
  return ALLOWED_COMMANDS.includes(firstWord);
}

export async function executeShellCommand(command: string, workingDir: string = process.cwd()): Promise<ShellResult> {
  if (!isCommandSafe(command)) {
    return {
      stdout: "",
      stderr: "Command blocked for security reasons",
      exitCode: 1
    };
  }

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
  
  if (!isCommandSafe(command)) {
    return {
      stdout: "",
      stderr: "Download command blocked for security reasons",
      exitCode: 1
    };
  }

  return executeShellCommand(command);
}

export function getCurrentDirectory(): string {
  return process.cwd();
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
