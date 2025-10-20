import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ModuleProps {
  id: string;
  title: string;
  icon: ReactNode;
  status?: "idle" | "active" | "complete" | "error";
  position: { x: number; y: number };
  children?: ReactNode;
  hasOutput?: boolean;
  hasInput?: boolean;
}

const WorkflowModule = ({ 
  title, 
  icon, 
  status = "idle", 
  position, 
  children,
  hasOutput = true,
  hasInput = false
}: ModuleProps) => {
  const getIconBgColor = () => {
    switch (status) {
      case "active":
        return "bg-accent";
      case "complete":
        return "bg-success";
      case "error":
        return "bg-destructive";
      default:
        return "bg-[hsl(270,70%,55%)]"; // Purple like Make.com
    }
  };

  return (
    <div
      className="absolute flex flex-col items-center gap-3"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Circular Icon Module */}
      <div className="relative">
        {/* Input Port */}
        {hasInput && (
          <div 
            className={cn(
              "absolute -left-8 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-background transition-all duration-300",
              status === "active" ? "border-accent scale-125" : "border-muted"
            )}
          />
        )}

        {/* Main Circle */}
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
          getIconBgColor(),
          status === "active" && "scale-110 shadow-xl",
          status === "complete" && "scale-105"
        )}>
          <div className="text-white">
            {icon}
          </div>
        </div>

        {/* Status Ring */}
        {status === "active" && (
          <div className="absolute inset-0 rounded-full border-4 border-accent/30 animate-ping" />
        )}

        {/* Output Port */}
        {hasOutput && (
          <div 
            className={cn(
              "absolute -right-8 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-background transition-all duration-300",
              status === "complete" ? "border-success scale-125" : "border-muted"
            )}
          />
        )}
      </div>

      {/* Module Label */}
      <div className="text-center">
        <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
        {status !== "idle" && (
          <div className="flex items-center justify-center gap-1.5">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              status === "active" && "bg-accent animate-pulse",
              status === "complete" && "bg-success",
              status === "error" && "bg-destructive"
            )} />
            <span className="text-xs capitalize text-muted-foreground">{status}</span>
          </div>
        )}
      </div>

      {/* Content Card (below the circle) */}
      {children && (
        <div className="bg-card border border-border rounded-lg p-3 w-64 shadow-sm">
          <div className="text-xs text-muted-foreground">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowModule;
