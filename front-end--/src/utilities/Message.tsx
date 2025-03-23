import { cn } from "@/lib/utils";

interface MessageProps {
    status: string | null,
    message: string | null
}

export default function Message({ status, message }: MessageProps) {
    return <div className={cn(" text-balance text-center font-light text-base w-full py-1 rounded-r-lg",
        status === "error" ? " bg-red-300 text-red-500 border-l-6 border-l-red-400 " :
            "bg-green-300 text-green-600 border-l-6 border-l-green-400",
        message ? "block" : "hidden")}>
        {message}
    </div>
}