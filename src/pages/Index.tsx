import { useState } from "react";
import { Upload, FileText, Clock, AlertCircle, CheckCircle2, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import UploadZone from "@/components/UploadZone";
import AnalysisResult from "@/components/AnalysisResult";
import AnalysisHistory from "@/components/AnalysisHistory";
import { supabase } from "@/integrations/supabase/client";

export interface Analysis {
  analysis_id: string;
  error_title: string;
  error_code: string | null;
  product: string | null;
  environment: Record<string, any> | null;
  key_text_blocks: Array<{
    text: string;
    bbox: [number, number, number, number];
    confidence: number;
  }>;
  probable_cause: string;
  suggested_fix: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  follow_up_questions: string[];
  status: "ok" | "failed";
  created_at?: string;
}

const Index = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setAnalyzing(true);
    setCurrentAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.reason || "Failed to analyze image");
      }

      const result: Analysis = await response.json();
      
      if (result.status === "failed") {
        throw new Error((result as any).reason || "Analysis failed");
      }

      setCurrentAnalysis(result);
      
      // Refresh history
      const { data } = await supabase
        .from("image_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (data) {
        setHistory(data as unknown as Analysis[]);
      }

      toast({
        title: "Analysis Complete",
        description: "Error information extracted successfully",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from("image_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (data) {
      setHistory(data as unknown as Analysis[]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Image Analyzer</h1>
              <p className="text-sm text-muted-foreground">
                Extract error information from screenshots for customer support
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analyze" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2" onClick={loadHistory}>
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6">
            {/* Upload Zone */}
            <UploadZone onFileSelect={handleFileSelect} analyzing={analyzing} />

            {/* Current Analysis Result */}
            {currentAnalysis && (
              <AnalysisResult analysis={currentAnalysis} />
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* API Integration Card */}
            <Card className="p-6 border-accent/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent" />
                API Integration
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Endpoint:</strong>{" "}
                  <code className="bg-muted px-2 py-1 rounded">
                    POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image
                  </code>
                </p>
                <p>
                  <strong className="text-foreground">Content-Type:</strong> multipart/form-data
                </p>
                <p>
                  <strong className="text-foreground">Field:</strong> file (PNG/JPEG, max 15 MB)
                </p>
                <p className="flex items-start gap-2 pt-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Use this endpoint from Make.com, Zapier, or any HTTP client for automated error analysis</span>
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <AnalysisHistory 
              history={history} 
              onSelect={setCurrentAnalysis}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
