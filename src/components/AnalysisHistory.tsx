import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Analysis } from "@/pages/Index";
import { Clock } from "lucide-react";

interface AnalysisHistoryProps {
  history: Analysis[];
  onSelect: (analysis: Analysis) => void;
}

const AnalysisHistory = ({ history, onSelect }: AnalysisHistoryProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (history.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload an image to start analyzing errors
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <Card
          key={item.analysis_id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelect(item)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getSeverityColor(item.severity)}>
                  {item.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {item.probable_cause.replace(/_/g, " ")}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-1 truncate">
                {item.error_title}
              </h3>
              {item.error_code && (
                <p className="text-sm text-muted-foreground font-mono">
                  {item.error_code}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {item.suggested_fix}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground">
                {formatDate(item.created_at)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(item.confidence * 100).toFixed(0)}% confident
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AnalysisHistory;
