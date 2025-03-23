import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    repeatPassword: z.string(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
