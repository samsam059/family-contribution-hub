import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EntrySidebar } from "@/components/EntrySidebar";

export default function EntryLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-svh flex w-full">
        <EntrySidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 shadow-sm">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
