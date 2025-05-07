import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useFormik } from "formik"
import { resetPasswordSchema, ResetPasswordFormData } from "@/schemas/resetPasswordSchema"
import Message from "@/utilities/Message"
import axios from "axios"

export default function ResetPasswordForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {

    const [status, setStatus] = useState<string | null>(null)
    const [isError, setIsError] = useState<boolean | false>(false)

    const formpik = useFormik<ResetPasswordFormData>({
        initialValues: {
            password: "",
            repeatPassword: ""
        },
        onSubmit: (values) => {
            const result = resetPasswordSchema.safeParse(values)

            if (!result.success) {
                setIsError(true)
                setStatus(result.error.errors[0].message)
                return
            }
            else {
                setIsError(false)
                setStatus("Your Password has been updated")
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
                        <h1 className="text-xl font-bold">Enter your new password</h1>
                    </div>

                    <Message status={isError ? "error" : "success"} message={status} />

                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                value={formpik.values.password}
                                onChange={formpik.handleChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="repeatPassword">Repeat Password</Label>
                            <Input
                                id="repeatPassword"
                                type="password"
                                name="repeatPassword"
                                value={formpik.values.repeatPassword}
                                onChange={formpik.handleChange}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full cursor-pointer">
                            Update Password
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
