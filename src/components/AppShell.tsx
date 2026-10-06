import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, FolderKanban, PlusCircle, Search, FileText, Mic, Images, Clapperboard, ImageIcon,
  TrendingUp, Bot, LayoutTemplate, Settings, Bell, Sparkles, Menu, X, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/new", label: "Create New Video", icon: PlusCircle },
  { to: "/research", label: "Research", icon: Search },
  { to: "/scripts", label: "Scripts", icon: FileText },
  { to: "/voiceovers", label: "Voiceovers", icon: Mic },
  { to: "/media", label: "Media Library", icon: Images },
  { to: "/editor", label: "Video Editor", icon: Clapperboard },
  { to: "/thumbnails", label: "Thumbnails", icon: ImageIcon },
  { to: "/seo", label: "YouTube SEO", icon: TrendingUp },
  { to: "/agents", label: "AI Agents", icon: Bot },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5" onClick={onNavigate}>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-display text-lg font-semibold">CreateFlow<span className="text-primary"> AI</span></span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 scrollbar-thin">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-border bg-hero p-4">
        <p className="text-xs font-semibold">Storage</p>
        <p className="mt-1 text-xs text-muted-foreground">38.2 GB of 100 GB</p>
        <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full w-[38%] rounded-full bg-gradient-primary" /></div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const fullBleed = path.startsWith("/editor");
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-surface lg:block">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 border-r border-border bg-surface">
            <button className="absolute right-3 top-5 text-muted-foreground" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <button className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm md:flex">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="max-w-56 truncate">20 Indoor Plants That Thrive in Water</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search projects, scenes, assets…" className="h-9 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <button className="hidden h-9 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary sm:flex">
            <Sparkles className="h-4 w-4" /> Assistant
          </button>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-elevated text-xs font-bold">AO</div>
        </header>
        <main className={cn("flex-1", fullBleed ? "" : "mx-auto w-full max-w-7xl p-4 md:p-8")}>{children}</main>
      </div>
    </div>
  );
}
