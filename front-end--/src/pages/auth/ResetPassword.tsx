import ResetPasswordForm from "../../components/auth-components/ResetPasswordForm"

export default function ResetPassword() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <ResetPasswordForm />
            </div>
        </div>
    )
}
