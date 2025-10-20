import { useState } from "react";
import { FileText, Clock, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkflowCanvas from "@/components/WorkflowCanvas";
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
  const [history, setHistory] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

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
        <Tabs defaultValue="workflow" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2" onClick={loadHistory}>
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="space-y-6">
            <WorkflowCanvas />
          </TabsContent>

          <TabsContent value="history">
            <AnalysisHistory 
              history={history} 
              onSelect={setSelectedAnalysis}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
