import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-gradient-primary text-primary-foreground hover:brightness-110 shadow-glow",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent border border-border",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
        outline: "border border-border text-foreground hover:bg-accent",
      },
      size: { sm: "h-8 px-3 text-xs", md: "h-9 px-4", lg: "h-11 px-6 text-base", icon: "h-9 w-9" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

const badgeVariants = cva("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", {
  variants: {
    tone: {
      default: "bg-muted text-muted-foreground",
      primary: "bg-primary/15 text-primary",
      success: "bg-success/15 text-success",
      warning: "bg-warning/15 text-warning",
      info: "bg-info/15 text-info",
      danger: "bg-destructive/15 text-destructive",
    },
  },
  defaultVariants: { tone: "default" },
});

export function Badge({ tone, children, className }: VariantProps<typeof badgeVariants> & { children: ReactNode; className?: string }) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
