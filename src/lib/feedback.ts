import { z } from "zod";

export const feedbackSchema = z.object({
  modelId: z.string().optional(),
  providerId: z.string().optional(),
  issueType: z.enum(["price", "billing", "risk", "source", "other"]),
  description: z.string().trim().min(5).max(2000),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  contact: z.string().trim().max(120).optional().or(z.literal("")),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export type FeedbackRecord = FeedbackInput & {
  id: string;
  createdAt: string;
  status: "pending";
};
