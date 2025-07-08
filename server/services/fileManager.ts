import * as fs from "fs/promises";
import * as path from "path";
import { File } from "@shared/schema";

export interface FileInfo {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: Date;
}

export async function listDirectory(dirPath: string): Promise<FileInfo[]> {
  try {
    const items = await fs.readdir(dirPath);
    const fileInfos: FileInfo[] = [];

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = await fs.stat(fullPath);
      
      fileInfos.push({
        name: item,
        path: fullPath,
        type: stats.isDirectory() ? "directory" : "file",
        size: stats.size,
        modified: stats.mtime
      });
    }

    return fileInfos.sort((a, b) => {
      // Directories first, then files
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error listing directory:", error);
    return [];
  }
}

export async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, content, "utf-8");
  } catch (error) {
    console.error("Error writing file:", error);
    throw new Error(`Failed to write file: ${filePath}`);
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await fs.rmdir(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error(`Failed to delete file: ${filePath}`);
  }
}

export async function createDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error("Error creating directory:", error);
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
}

export function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function getFileLanguage(fileName: string): string {
  const ext = getFileExtension(fileName);
  const languageMap: { [key: string]: string } = {
    ".js": "javascript",
    ".ts": "typescript",
    ".jsx": "javascript",
    ".tsx": "typescript",
    ".py": "python",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".json": "json",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".sql": "sql",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "zsh",
    ".fish": "fish"
  };

  return languageMap[ext] || "plaintext";
}
