import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export type ForgotPasswrdFormData = z.infer<typeof forgotPasswordSchema>;
