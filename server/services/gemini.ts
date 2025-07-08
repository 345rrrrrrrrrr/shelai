import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || ""
});

export interface CommandAnalysis {
  isShellCommand: boolean;
  command: string;
  description: string;
  safetyLevel: "safe" | "warning" | "dangerous";
  suggestions: string[];
  setupCommands?: string[];
  requiredFiles?: string[];
  requiredDirectories?: string[];
}

export async function analyzeCommand(input: string): Promise<CommandAnalysis> {
  try {
    const systemPrompt = `You are a shell command analyzer with environment setup capabilities. For ANY actionable request, analyze what needs to be set up BEFORE executing the main command.

IMPORTANT: Always analyze the full workflow:
1. What directories need to exist?
2. What files need to be created first?
3. What setup commands should run before the main command?
4. What is the final command to execute?

For actionable requests like:
- File operations (create, delete, move, copy)
- Directory operations (make, list, navigate)
- System information queries
- Network operations
- Data processing tasks
- Any task that can be accomplished via shell

For conversational greetings or questions, set command to "N/A".

EXAMPLES:
- "scan networks" → setupCommands: ["mkdir -p data_output", "touch network_scan.txt"], requiredDirectories: ["data_output"], requiredFiles: ["network_scan.txt"]
- "create report" → setupCommands: ["mkdir -p reports", "touch reports/template.txt"], requiredDirectories: ["reports"], requiredFiles: ["reports/template.txt"]

Respond with JSON in this format:
{
  "isShellCommand": boolean,
  "command": "string",
  "description": "string", 
  "safetyLevel": "safe" | "warning" | "dangerous",
  "suggestions": ["string"],
  "setupCommands": ["string"] (optional - commands to run before main command),
  "requiredFiles": ["string"] (optional - files that need to exist),
  "requiredDirectories": ["string"] (optional - directories that need to exist)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            isShellCommand: { type: "boolean" },
            command: { type: "string" },
            description: { type: "string" },
            safetyLevel: { type: "string", enum: ["safe", "warning", "dangerous"] },
            suggestions: { type: "array", items: { type: "string" } },
            setupCommands: { type: "array", items: { type: "string" } },
            requiredFiles: { type: "array", items: { type: "string" } },
            requiredDirectories: { type: "array", items: { type: "string" } }
          },
          required: ["isShellCommand", "command", "description", "safetyLevel", "suggestions"]
        }
      },
      contents: input,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Error analyzing command:", error);
    return {
      isShellCommand: false,
      command: input,
      description: "Unable to analyze command",
      safetyLevel: "warning",
      suggestions: ["Please try rephrasing your request"]
    };
  }
}

export async function generateCode(request: string, language: string = "javascript"): Promise<string> {
  try {
    const prompt = `Generate ${language} code for the following request: ${request}

Provide clean, well-commented code that follows best practices. Only return the code, no explanations.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    return response.text || "// Unable to generate code";
  } catch (error) {
    console.error("Error generating code:", error);
    return "// Error generating code";
  }
}

export async function setupEnvironment(analysis: CommandAnalysis): Promise<string[]> {
  const setupResults: string[] = [];
  
  try {
    // Create required directories
    if (analysis.requiredDirectories) {
      for (const dir of analysis.requiredDirectories) {
        const { executeShellCommand } = await import('./shell');
        const result = await executeShellCommand(`mkdir -p "${dir}"`);
        setupResults.push(`Directory created: ${dir} (${result.exitCode === 0 ? 'success' : 'failed'})`);
      }
    }
    
    // Create required files
    if (analysis.requiredFiles) {
      for (const file of analysis.requiredFiles) {
        const { executeShellCommand } = await import('./shell');
        const result = await executeShellCommand(`touch "${file}"`);
        setupResults.push(`File created: ${file} (${result.exitCode === 0 ? 'success' : 'failed'})`);
      }
    }
    
    // Run setup commands
    if (analysis.setupCommands) {
      for (const setupCmd of analysis.setupCommands) {
        const { executeShellCommand } = await import('./shell');
        const result = await executeShellCommand(setupCmd);
        setupResults.push(`Setup command: ${setupCmd} (${result.exitCode === 0 ? 'success' : 'failed'})`);
      }
    }
    
    return setupResults;
  } catch (error) {
    setupResults.push(`Setup error: ${error}`);
    return setupResults;
  }
}

export async function processNaturalLanguageRequest(request: string): Promise<string> {
  try {
    const systemPrompt = `You are an AI assistant that helps with shell commands, file management, and code generation. 
Provide helpful, accurate responses to user requests. If the user wants to execute a command, provide the exact command.
If they want to create files or code, provide the content. Be concise but informative.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: request,
    });

    return response.text || "I'm sorry, I couldn't process your request.";
  } catch (error) {
    console.error("Error processing natural language request:", error);
    return "I encountered an error while processing your request. Please try again.";
  }
}
