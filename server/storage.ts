import { commands, files, systemStatus, type Command, type File, type SystemStatus, type InsertCommand, type InsertFile } from "@shared/schema";

export interface IStorage {
  // Command methods
  createCommand(command: InsertCommand): Promise<Command>;
  updateCommand(id: number, updates: Partial<Command>): Promise<Command>;
  getCommand(id: number): Promise<Command | undefined>;
  getCommands(): Promise<Command[]>;
  
  // File methods
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<File>): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  getFiles(): Promise<File[]>;
  deleteFile(id: number): Promise<void>;
  
  // System status methods
  getSystemStatus(): Promise<SystemStatus>;
  updateSystemStatus(updates: Partial<SystemStatus>): Promise<SystemStatus>;
}

export class MemStorage implements IStorage {
  private commands: Map<number, Command>;
  private files: Map<number, File>;
  private systemStatusData: SystemStatus;
  private currentCommandId: number;
  private currentFileId: number;

  constructor() {
    this.commands = new Map();
    this.files = new Map();
    this.currentCommandId = 1;
    this.currentFileId = 1;
    this.systemStatusData = {
      id: 1,
      aiModelStatus: "connected",
      shellAccess: "active",
      safetyMode: true,
      workingDirectory: "/home/runner/workspace",
      updatedAt: new Date()
    };
  }

  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const id = this.currentCommandId++;
    const command: Command = {
      ...insertCommand,
      id,
      output: null,
      isAiCommand: insertCommand.isAiCommand || false,
      status: insertCommand.status || "pending",
      createdAt: new Date()
    };
    this.commands.set(id, command);
    return command;
  }

  async updateCommand(id: number, updates: Partial<Command>): Promise<Command> {
    const command = this.commands.get(id);
    if (!command) {
      throw new Error(`Command with id ${id} not found`);
    }
    
    const updatedCommand = { ...command, ...updates };
    this.commands.set(id, updatedCommand);
    return updatedCommand;
  }

  async getCommand(id: number): Promise<Command | undefined> {
    return this.commands.get(id);
  }

  async getCommands(): Promise<Command[]> {
    return Array.from(this.commands.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const file: File = {
      ...insertFile,
      id,
      content: insertFile.content || null,
      size: insertFile.content?.length || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: number, updates: Partial<File>): Promise<File> {
    const file = this.files.get(id);
    if (!file) {
      throw new Error(`File with id ${id} not found`);
    }
    
    const updatedFile = { 
      ...file, 
      ...updates, 
      updatedAt: new Date(),
      size: updates.content?.length || file.size
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFiles(): Promise<File[]> {
    return Array.from(this.files.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }

  async getSystemStatus(): Promise<SystemStatus> {
    return this.systemStatusData;
  }

  async updateSystemStatus(updates: Partial<SystemStatus>): Promise<SystemStatus> {
    this.systemStatusData = {
      ...this.systemStatusData,
      ...updates,
      updatedAt: new Date()
    };
    return this.systemStatusData;
  }
}

export const storage = new MemStorage();
