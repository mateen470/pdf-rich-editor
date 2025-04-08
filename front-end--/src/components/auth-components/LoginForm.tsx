import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useFormik } from "formik"
import { loginSchema, LoginFormData } from "@/schemas/loginFormSchema"
import Message from "@/utilities/Message"

interface ApiCallError extends Error {
    response?: {
        data?: {
            message?: string;
        };
    };
}

export default function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {

    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const formpik = useFormik<LoginFormData>({
        initialValues: {
            email: "",
            password: ""
        },
        onSubmit: async (values) => {
            const result = loginSchema.safeParse(values);
            if (!result.success) {
                setError(result.error.errors[0].message);
                return;
            }
            try {
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, values);
                navigate("/dashboard");
            } catch (err: unknown) {
                const requestError = err as ApiCallError
                setError(requestError.response?.data?.message || "Something went wrong");
            }
        }
    })

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={formpik.handleSubmit}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <h1 className="text-xl font-bold">Welcome to <strong >PDFaddy</strong></h1>
                        <div className="text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link to="/register" className="underline underline-offset-4">
                                Sign up
                            </Link>
                        </div>
                    </div>

                    <Message status={"error"} message={error} />

                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={formpik.values.email}
                                onChange={formpik.handleChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    to="/forgot-password"
                                    className="ml-auto text-sm underline-offset-4 hover:underline"
                                >
                                    Forgot your password?
                                </Link>
                            </div>
                            <Input id="password" type="password" name="password" value={formpik.values.password} onChange={formpik.handleChange} required />
                        </div>
                        <Button type="submit" className="w-full cursor-pointer">
                            Login
                        </Button>
                    </div>
                    <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground">
                            Or
                        </span>
                    </div>

                    <Button variant="outline" className="w-full cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path
                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                fill="currentColor"
                            />
                        </svg>
                        Continue with Google
                    </Button>
                </div>
            </form>
        </div>
    )
}
