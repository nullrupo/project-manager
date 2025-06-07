import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher({ minimal = false }: { minimal?: boolean } = {}) {
  const { theme, setTheme } = useTheme();

  // Toggle between dark and light only
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant={minimal ? "ghost" : "outline"}
      size={minimal ? "icon" : "sm"}
      className={
        minimal
          ? "h-6 w-6 p-0 flex items-center justify-center"
          : "flex items-center gap-2 px-3 py-2 h-9 border-sidebar-border/50 bg-sidebar-accent/20 hover:bg-sidebar-accent/30"
      }
      aria-label="Toggle theme"
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
