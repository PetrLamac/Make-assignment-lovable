import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Analysis } from "@/pages/Index";
import { Clock, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AnalysisHistoryProps {
  history: Analysis[];
  onSelect: (analysis: Analysis) => void;
}

const AnalysisHistory = ({ history, onSelect }: AnalysisHistoryProps) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleItem = (analysisId: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analysisId)) {
        newSet.delete(analysisId);
      } else {
        newSet.add(analysisId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (analysis: Analysis) => {
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    toast({
      title: "Copied to clipboard",
      description: "Analysis JSON has been copied to your clipboard",
    });
  };

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
      {history.map((item) => {
        const isOpen = openItems.has(item.analysis_id);
        return (
          <Collapsible key={item.analysis_id} open={isOpen} onOpenChange={() => toggleItem(item.analysis_id)}>
            <Card className="p-4">
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
                  <h3 className="font-semibold text-foreground mb-1">
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

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  {isOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show Details
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4 space-y-4">
                {/* Suggested Fix */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Suggested Fix</h4>
                  <p className="text-sm text-muted-foreground">{item.suggested_fix}</p>
                </div>

                {/* Product & Environment */}
                {(item.product || item.environment) && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {item.product && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Product</h4>
                        <p className="text-sm text-muted-foreground">{item.product}</p>
                      </div>
                    )}
                    {item.environment && Object.keys(item.environment).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Environment</h4>
                        <div className="space-y-1">
                          {Object.entries(item.environment).map(([key, value]) => (
                            <p key={key} className="text-sm text-muted-foreground">
                              <span className="font-mono">{key}:</span> {String(value)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Follow-up Questions */}
                {item.follow_up_questions && item.follow_up_questions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Follow-up Questions</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {item.follow_up_questions.map((question, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">{question}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Text Blocks */}
                {item.key_text_blocks && item.key_text_blocks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Extracted Text</h4>
                    <div className="space-y-2">
                      {item.key_text_blocks.map((block, idx) => (
                        <div key={idx} className="bg-muted/50 p-2 rounded text-sm">
                          <p className="font-mono text-xs text-muted-foreground mb-1">
                            Confidence: {(block.confidence * 100).toFixed(0)}%
                          </p>
                          <p className="text-foreground">{block.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw JSON Response */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Raw JSON Response</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(item)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                  <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{JSON.stringify(item, null, 2)}</code>
                  </pre>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default AnalysisHistory;
