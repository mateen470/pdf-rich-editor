import { useState } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useFormik } from "formik"
import { forgotPasswordSchema, ForgotPasswrdFormData } from "@/schemas/forgetPasswordFormSchema"
import Message from "@/utilities/Message"

export default function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {

    const [status, setStatus] = useState<string | null>(null)
    const [isError, setIsError] = useState<boolean | false>(false)

    const formpik = useFormik<ForgotPasswrdFormData>({
        initialValues: {
            email: ""
        },
        onSubmit: (values) => {
            const result = forgotPasswordSchema.safeParse(values)

            if (!result.success) {
                setIsError(true)
                setStatus(result.error.errors[0].message)
                return
            }
            else {
                setIsError(false)
                setStatus("Please check your Email")
                return
            }
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

                    <Message status={isError ? "error" : "success"} message={status} />

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
