import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  price: integer("price").notNull(), // in cents
  currency: text("currency").notNull().default("EUR"),
  images: jsonb("images").$type<string[]>().notNull(),
  sizes: jsonb("sizes").$type<string[]>().notNull(),
  category: text("category").notNull(),
  gender: text("gender"),
  description: text("description"),
});

export const uploadSessions = pgTable("upload_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  filesize: integer("filesize").notNull(),
  mimetype: text("mimetype").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const tryOnJobs = pgTable("try_on_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  uploadId: varchar("upload_id").notNull(),
  productIds: jsonb("product_ids").$type<string[]>().notNull(),
  status: text("status").notNull().default("queued"), // queued, processing, succeeded, failed
  resultUrls: jsonb("result_urls").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertUploadSessionSchema = createInsertSchema(uploadSessions).omit({
  id: true,
  createdAt: true,
});

export const insertTryOnJobSchema = createInsertSchema(tryOnJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UploadSession = typeof uploadSessions.$inferSelect;
export type InsertUploadSession = z.infer<typeof insertUploadSessionSchema>;
export type TryOnJob = typeof tryOnJobs.$inferSelect;
export type InsertTryOnJob = z.infer<typeof insertTryOnJobSchema>;

export type JobStatus = "queued" | "processing" | "succeeded" | "failed";
