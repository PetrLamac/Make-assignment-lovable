import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
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
  const getStatusStyles = () => {
    switch (status) {
      case "active":
        return "border-accent shadow-lg shadow-accent/20 ring-2 ring-accent/50";
      case "complete":
        return "border-success shadow-lg shadow-success/20";
      case "error":
        return "border-destructive shadow-lg shadow-destructive/20";
      default:
        return "border-border";
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <Card className={cn(
        "w-64 p-4 transition-all duration-300",
        getStatusStyles()
      )}>
        {/* Input Port */}
        {hasInput && (
          <div 
            className={cn(
              "absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 bg-background transition-colors",
              status === "active" ? "border-accent bg-accent/20" : "border-border"
            )}
          />
        )}

        {/* Module Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            status === "active" ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
          )}>
            {icon}
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>

        {/* Module Content */}
        {children && (
          <div className="text-sm text-muted-foreground">
            {children}
          </div>
        )}

        {/* Status Indicator */}
        {status !== "idle" && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                "w-2 h-2 rounded-full",
                status === "active" && "bg-accent animate-pulse",
                status === "complete" && "bg-success",
                status === "error" && "bg-destructive"
              )} />
              <span className="capitalize text-muted-foreground">{status}</span>
            </div>
          </div>
        )}

        {/* Output Port */}
        {hasOutput && (
          <div 
            className={cn(
              "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 bg-background transition-colors",
              status === "complete" ? "border-success bg-success/20" : "border-border"
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default WorkflowModule;
