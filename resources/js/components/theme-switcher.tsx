import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, Monitor } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  // Function to get the current theme icon
  const getCurrentThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5" />;
      case "dark":
        return <Moon className="h-5 w-5" />;
      case "system":
        return <Monitor className="h-5 w-5" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  // Function to get the current theme label
  const getCurrentThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light Mode";
      case "dark":
        return "Dark Mode";
      case "system":
        return "System Theme";
      default:
        return "Light Mode";
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 h-9 border-sidebar-border/50 bg-sidebar-accent/20 hover:bg-sidebar-accent/30"
              >
                {getCurrentThemeIcon()}
                <span className="hidden md:inline">{getCurrentThemeLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className={theme === "light" ? "bg-sidebar-accent/20" : ""}
              >
                <Sun className="mr-2 h-5 w-5" />
                <span>Light Mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className={theme === "dark" ? "bg-sidebar-accent/20" : ""}
              >
                <Moon className="mr-2 h-5 w-5" />
                <span>Dark Mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className={theme === "system" ? "bg-sidebar-accent/20" : ""}
              >
                <Monitor className="mr-2 h-5 w-5" />
                <span>System Theme</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Change theme</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
