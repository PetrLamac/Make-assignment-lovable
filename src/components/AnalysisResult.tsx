import { Copy, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Analysis } from "@/pages/Index";

interface AnalysisResultProps {
  analysis: Analysis;
}

const AnalysisResult = ({ analysis }: AnalysisResultProps) => {
  const { toast } = useToast();

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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4" />;
      case "low":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const copyToClipboard = () => {
    const json = JSON.stringify(analysis, null, 2);
    navigator.clipboard.writeText(json);
    toast({
      title: "Copied to clipboard",
      description: "Analysis JSON copied successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getSeverityColor(analysis.severity)}>
                <span className="flex items-center gap-1">
                  {getSeverityIcon(analysis.severity)}
                  {analysis.severity.toUpperCase()}
                </span>
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {analysis.probable_cause.replace(/_/g, " ")}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {analysis.error_title}
            </h2>
            {analysis.error_code && (
              <p className="text-sm text-muted-foreground font-mono">
                Code: {analysis.error_code}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy JSON
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {analysis.product && (
            <div>
              <span className="text-muted-foreground">Product:</span>
              <p className="font-medium">{analysis.product}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Confidence:</span>
            <p className="font-medium">{(analysis.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>

        {analysis.environment && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Environment</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(analysis.environment).map(([key, value]) => (
                <div key={key}>
                  <span className="text-muted-foreground capitalize">{key}:</span>{" "}
                  <span className="font-medium">{value as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Suggested Fix */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          Suggested Fix
        </h3>
        <p className="text-foreground leading-relaxed">{analysis.suggested_fix}</p>
      </Card>

      {/* Follow-up Questions */}
      {analysis.follow_up_questions && analysis.follow_up_questions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-3">Follow-up Questions</h3>
          <ul className="space-y-2">
            {analysis.follow_up_questions.map((question, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary font-semibold mt-0.5">{idx + 1}.</span>
                <span className="text-foreground">{question}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Key Text Blocks */}
      {analysis.key_text_blocks && analysis.key_text_blocks.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-3">Extracted Text</h3>
          <div className="space-y-2">
            {analysis.key_text_blocks.map((block, idx) => (
              <div
                key={idx}
                className="p-3 bg-muted rounded font-mono text-sm"
              >
                <p className="text-foreground">{block.text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {(block.confidence * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Raw JSON */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-3">Raw JSON Response</h3>
        <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default AnalysisResult;
