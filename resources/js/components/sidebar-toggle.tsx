import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export function SidebarToggle() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 px-3 py-2 h-9 border-sidebar-border/50 bg-sidebar-accent/20 hover:bg-sidebar-accent/30"
            >
              {isCollapsed ? (
                <>
                  <PanelLeftOpen className="h-5 w-5" />
                  <span className="hidden md:inline">Expand Sidebar</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="h-5 w-5" />
                  <span className="hidden md:inline">Collapse Sidebar</span>
                </>
              )}
            </Button>
          </SidebarTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
