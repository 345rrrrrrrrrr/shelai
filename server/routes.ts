import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeCommand, generateCode, processNaturalLanguageRequest, setupEnvironment } from "./services/gemini";
import { executeShellCommand, downloadFile, getCurrentDirectory, changeDirectory } from "./services/shell";
import { listDirectory, readFile, writeFile, deleteFile, createDirectory, getFileLanguage } from "./services/fileManager";
import { insertCommandSchema, insertFileSchema, updateFileSchema } from "@shared/schema";
import { commandQueue } from "./services/commandQueue";

export async function registerRoutes(app: Express): Promise<Server> {
  // Command execution endpoint with concurrent processing
  app.post("/api/commands", async (req, res) => {
    try {
      const { input, isAiCommand } = insertCommandSchema.parse(req.body);
      
      const command = await storage.createCommand({
        input,
        isAiCommand: isAiCommand || false,
        status: "running"
      });

      // Return command immediately and process asynchronously
      res.json(command);

      // Process command asynchronously with queue management
      setImmediate(async () => {
        await commandQueue.execute(command.id, async () => {
          try {
            let output = "";
            let status = "completed";

            if (isAiCommand) {
              // Process through AI first
              const analysis = await analyzeCommand(input);
              
              // Check if the command is valid before executing
              const invalidCommands = ['N/A', 'n/a', 'null', 'undefined', 'none', 'no command', 'not applicable'];
              const isValidCommand = analysis.command && 
                analysis.command.trim() !== "" && 
                !invalidCommands.includes(analysis.command.trim().toLowerCase());

              if (isValidCommand) {
                // Set up environment first (create directories, files, etc.)
                const setupResults = await setupEnvironment(analysis);
                
                // Execute the AI-generated shell command (no safety restrictions)
                const result = await executeShellCommand(analysis.command);
                
                // Combine setup and execution results
                const outputParts = [];
                if (setupResults.length > 0) {
                  outputParts.push(`Environment Setup:\n${setupResults.join('\n')}\n`);
                }
                outputParts.push(`Command Execution:\n${result.stdout || result.stderr || "Command completed"}`);
                
                output = outputParts.join('\n');
                status = result.exitCode === 0 ? "completed" : "error";
              } else {
                // For purely conversational input, use natural language processing
                output = await processNaturalLanguageRequest(input);
              }
            } else {
              // Direct shell command execution
              const result = await executeShellCommand(input);
              output = result.stdout || result.stderr;
              status = result.exitCode === 0 ? "completed" : "error";
            }

            // Update command status after completion
            await storage.updateCommand(command.id, {
              output,
              status
            });
          } catch (error) {
            console.error("Error executing command asynchronously:", error);
            await storage.updateCommand(command.id, {
              output: `Error: ${(error as Error).message || 'Unknown error'}`,
              status: "error"
            });
          }
        });
      });
    } catch (error) {
      console.error("Error creating command:", error);
      res.status(500).json({ message: "Failed to create command" });
    }
  });

  // Get command history
  app.get("/api/commands", async (req, res) => {
    try {
      const commands = await storage.getCommands();
      res.json(commands);
    } catch (error) {
      console.error("Error fetching commands:", error);
      res.status(500).json({ message: "Failed to fetch commands" });
    }
  });

  // File system endpoints
  app.get("/api/files", async (req, res) => {
    try {
      const dirPath = (req.query.path as string) || getCurrentDirectory();
      const files = await listDirectory(dirPath);
      res.json(files);
    } catch (error) {
      console.error("Error listing files:", error);
      res.status(500).json({ message: "Failed to list files" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.getFile(parseInt(req.params.id));
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      
      if (fileData.type === "file" && fileData.content) {
        await writeFile(fileData.path, fileData.content);
      } else if (fileData.type === "directory") {
        await createDirectory(fileData.path);
      }

      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    try {
      const fileData = updateFileSchema.parse(req.body);
      const file = await storage.getFile(parseInt(req.params.id));
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (fileData.content) {
        await writeFile(file.path, fileData.content);
      }

      const updatedFile = await storage.updateFile(file.id, fileData);
      res.json(updatedFile);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.getFile(parseInt(req.params.id));
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      await deleteFile(file.path);
      await storage.deleteFile(file.id);
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Code generation endpoint
  app.post("/api/generate-code", async (req, res) => {
    try {
      const { request, language } = req.body;
      const code = await generateCode(request, language);
      res.json({ code });
    } catch (error) {
      console.error("Error generating code:", error);
      res.status(500).json({ message: "Failed to generate code" });
    }
  });

  // Download file endpoint
  app.post("/api/download", async (req, res) => {
    try {
      const { url, destination } = req.body;
      const result = await downloadFile(url, destination);
      
      if (result.exitCode === 0) {
        res.json({ message: "File downloaded successfully", output: result.stdout });
      } else {
        res.status(500).json({ message: "Download failed", error: result.stderr });
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // System status endpoint with concurrent command info
  app.get("/api/system-status", async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      const concurrentInfo = {
        runningCommands: commandQueue.getRunningCount(),
        runningCommandIds: commandQueue.getRunningCommands()
      };
      res.json({ ...status, concurrent: concurrentInfo });
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ message: "Failed to fetch system status" });
    }
  });

  // Working directory endpoints
  app.get("/api/working-directory", async (req, res) => {
    try {
      const workingDir = getCurrentDirectory();
      res.json({ workingDirectory: workingDir });
    } catch (error) {
      console.error("Error getting working directory:", error);
      res.status(500).json({ message: "Failed to get working directory" });
    }
  });

  // Test shell connection endpoint
  app.get("/api/test-shell", async (req, res) => {
    try {
      const testCommands = [
        "pwd",
        "whoami", 
        "echo 'AI Shell Test: Connected to Replit'",
        "ls -la",
        "uname -a"
      ];
      
      const results = [];
      for (const cmd of testCommands) {
        const result = await executeShellCommand(cmd);
        results.push({
          command: cmd,
          output: result.stdout || result.stderr,
          exitCode: result.exitCode
        });
      }
      
      res.json({ 
        message: "Shell connection test completed",
        environment: "Replit",
        results 
      });
    } catch (error) {
      console.error("Error testing shell:", error);
      res.status(500).json({ message: "Failed to test shell connection" });
    }
  });

  app.post("/api/working-directory", async (req, res) => {
    try {
      const { path } = req.body;
      const success = changeDirectory(path);
      
      if (success) {
        const newDir = getCurrentDirectory();
        await storage.updateSystemStatus({ workingDirectory: newDir });
        res.json({ workingDirectory: newDir });
      } else {
        res.status(400).json({ message: "Failed to change directory" });
      }
    } catch (error) {
      console.error("Error changing directory:", error);
      res.status(500).json({ message: "Failed to change directory" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
