import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useFormik } from "formik"
import { forgotPasswordSchema, ForgotPasswrdFormData } from "@/schemas/forgetPasswordFormSchema"
import Message from "@/utilities/Message"

interface ApiCallError extends Error {
    response?: {
        data?: {
            message?: string;
        };
    };
}

export default function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {

    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<boolean | false>(false)

    const formpik = useFormik<ForgotPasswrdFormData>({
        initialValues: {
            email: ""
        },
        onSubmit: async (values) => {
            const result = forgotPasswordSchema.safeParse(values)

            if (!result.success) {
                setError(true)
                setStatus(result.error.errors[0].message)
                return
            }
            try {
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/forget-password`, values);
                setError(false)
                setStatus("Please check your Email!")
            } catch (err: unknown) {
                const requestError = err as ApiCallError
                setStatus(requestError.response?.data?.message || "Something went wrong");
            }
            return
        }

    })
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={formpik.handleSubmit}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <h1 className="text-xl font-bold">Enter your email</h1>
                        <div className="text-center text-sm">
                            Back to Login page?{" "}
                            <Link to="/" className="underline underline-offset-4">
                                Login
                            </Link>
                        </div>
                    </div>

                    <Message status={error ? "error" : "success"} message={status} />

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
                        <Button type="submit" className="w-full cursor-pointer">
                            Submit
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
