import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useFormik } from "formik"
import { registerSchema, RegisterFormData } from "@/schemas/registerFormSchema"
import Message from "@/utilities/Message"

interface ApiCallError extends Error {
    response?: {
        data?: {
            message?: string;
        };
    };
}
interface RegisterResponse {
    message?: string;
};


export default function RegisterForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {

    const [message, setMessage] = useState<string | null>(null)
    const [status, setStatus] = useState<"success" | "error" | "">("")

    const formpik = useFormik<RegisterFormData>({
        initialValues: {
            name: "",
            email: "",
            password: "",
            repeatPassword: ""
        },
        onSubmit: async (values) => {
            const result = registerSchema.safeParse(values)

            if (!result.success) {
                setStatus("error")
                setMessage(result.error.errors[0].message)
                return
            }
            try {
                const registerRequest = await axios.post<RegisterResponse>(`${import.meta.env.VITE_BACKEND_URL}/auth/register`, values)
                setStatus("success")
                setMessage(registerRequest.data?.message || "Please check your email!");

            } catch (err: unknown) {
                const requestError = err as ApiCallError
                setStatus("error")
                setMessage(requestError.response?.data?.message || "Something went wrong");
            }
        }
    })

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={formpik.handleSubmit}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <h1 className="text-xl font-bold">Let's get you started with <strong >PDFaddy</strong></h1>
                        <div className="text-center text-sm">
                            Already have an account?{" "}
                            <Link to="/" className="underline underline-offset-4">
                                Sign In
                            </Link>
                        </div>
                    </div>

                    <Message status={status} message={message} />

                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="name"
                                name="name"
                                value={formpik.values.name}
                                onChange={formpik.handleChange}
                                required
                            />
                        </div>
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
                            </div>
                            <Input id="password" type="password" name="password" value={formpik.values.password} onChange={formpik.handleChange} required />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="repeatPassword">Repeat password</Label>
                            </div>
                            <Input id="repeatPassword" type="password" name="repeatPassword" value={formpik.values.repeatPassword} onChange={formpik.handleChange} required />
                        </div>
                        <Button type="submit" className="w-full cursor-pointer">
                            Register
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
                        SignUp with Google
                    </Button>
                </div>
            </form>
        </div>
    )
}
