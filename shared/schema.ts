import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  input: text("input").notNull(),
  output: text("output"),
  isAiCommand: boolean("is_ai_command").notNull().default(false),
  status: text("status").notNull().default("pending"), // pending, running, completed, error
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  content: text("content"),
  type: text("type").notNull(), // file, directory
  size: integer("size").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemStatus = pgTable("system_status", {
  id: serial("id").primaryKey(),
  aiModelStatus: text("ai_model_status").notNull().default("connected"),
  shellAccess: text("shell_access").notNull().default("active"),
  safetyMode: boolean("safety_mode").default(true),
  workingDirectory: text("working_directory").notNull().default("/home/user"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommandSchema = createInsertSchema(commands).pick({
  input: true,
  isAiCommand: true,
  status: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  path: true,
  content: true,
  type: true,
});

export const updateFileSchema = createInsertSchema(files).pick({
  content: true,
}).partial();

export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commands.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type SystemStatus = typeof systemStatus.$inferSelect;
