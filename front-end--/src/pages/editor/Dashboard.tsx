import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"


import { AppSidebar } from "../../components/editor-components/AppSidebar"
import { HistoryTable } from "@/components/editor-components/HistoryTable"

export default function Dashboard() {
    return (

                            <HistoryTable />
    )
}
