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
}

export async function analyzeCommand(input: string): Promise<CommandAnalysis> {
  try {
    const systemPrompt = `You are a shell command analyzer. Analyze the user input and determine:
1. If it's a shell command or natural language request
2. The actual command to execute (if applicable)
3. A description of what it does
4. Safety level (safe, warning, dangerous)
5. Suggestions for improvement or alternatives

Respond with JSON in this format:
{
  "isShellCommand": boolean,
  "command": "string",
  "description": "string",
  "safetyLevel": "safe" | "warning" | "dangerous",
  "suggestions": ["string"]
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
            suggestions: { type: "array", items: { type: "string" } }
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
