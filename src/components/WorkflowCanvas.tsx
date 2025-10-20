import { useState, useRef } from "react";
import { Upload, Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import WorkflowModule from "./WorkflowModule";
import { supabase } from "@/integrations/supabase/client";
import AnalysisResult from "./AnalysisResult";
import { Analysis } from "@/pages/Index";

const WorkflowCanvas = () => {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [moduleStatuses, setModuleStatuses] = useState({
    upload: "idle" as "idle" | "active" | "complete" | "error",
    analyze: "idle" as "idle" | "active" | "complete" | "error",
    results: "idle" as "idle" | "active" | "complete" | "error",
  });
  const [flowActive, setFlowActive] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG or JPEG image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (15 MB)
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 15 MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setUploadedImageUrl(URL.createObjectURL(file));
    setModuleStatuses({
      upload: "complete",
      analyze: "idle",
      results: "idle",
    });
    setAnalysis(null);
    setFlowActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const runWorkflow = async () => {
    if (!uploadedFile) return;

    setFlowActive(true);
    setModuleStatuses({
      upload: "complete",
      analyze: "active",
      results: "idle",
    });

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append("file", uploadedFile);

      // Call edge function
      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: formData,
      });

      if (error) throw error;

      // Update to results phase
      setModuleStatuses({
        upload: "complete",
        analyze: "complete",
        results: "complete",
      });

      setAnalysis(data);
      setFlowActive(false);

      toast({
        title: "Analysis Complete",
        description: "Image analyzed successfully",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      setModuleStatuses({
        upload: "complete",
        analyze: "error",
        results: "idle",
      });
      setFlowActive(false);

      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-12rem)] bg-muted/30 rounded-lg overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Canvas Content */}
      <div 
        className="relative w-full h-full"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="hsl(var(--border))"
                className="transition-all duration-300"
              />
            </marker>
          </defs>
          
          {/* Upload to Analyze Connection */}
          <path
            d="M 300 200 Q 400 200 500 200"
            stroke={moduleStatuses.analyze !== "idle" ? "hsl(var(--accent))" : "hsl(var(--border))"}
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="transition-all duration-500"
            strokeDasharray={flowActive && moduleStatuses.analyze === "active" ? "5,5" : "0"}
            style={{
              animation: flowActive && moduleStatuses.analyze === "active" 
                ? "dash 1s linear infinite" 
                : "none"
            }}
          />
          
          {/* Analyze to Results Connection */}
          <path
            d="M 700 200 Q 800 200 900 200"
            stroke={moduleStatuses.results !== "idle" ? "hsl(var(--success))" : "hsl(var(--border))"}
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="transition-all duration-500"
            strokeDasharray={flowActive && moduleStatuses.results === "active" ? "5,5" : "0"}
            style={{
              animation: flowActive && moduleStatuses.results === "active" 
                ? "dash 1s linear infinite" 
                : "none"
            }}
          />
        </svg>

        {/* Modules */}
        <WorkflowModule
          id="upload"
          title="Image Upload"
          icon={<Upload className="h-5 w-5" />}
          status={moduleStatuses.upload}
          position={{ x: 200, y: 200 }}
          hasInput={false}
          hasOutput={true}
        >
          {!uploadedFile ? (
            <div className="text-center">
              <p className="mb-2">Drop image here or click to upload</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Browse Files
              </Button>
            </div>
          ) : (
            <div>
              <img 
                src={uploadedImageUrl!} 
                alt="Uploaded" 
                className="w-full h-24 object-cover rounded mb-2"
              />
              <p className="text-xs truncate">{uploadedFile.name}</p>
            </div>
          )}
        </WorkflowModule>

        <WorkflowModule
          id="analyze"
          title="AI Analyzer"
          icon={<Brain className="h-5 w-5" />}
          status={moduleStatuses.analyze}
          position={{ x: 600, y: 200 }}
          hasInput={true}
          hasOutput={true}
        >
          <p>Analyzes error screenshots using AI vision</p>
        </WorkflowModule>

        <WorkflowModule
          id="results"
          title="Results"
          icon={<FileText className="h-5 w-5" />}
          status={moduleStatuses.results}
          position={{ x: 1000, y: 200 }}
          hasInput={true}
          hasOutput={false}
        >
          <p>View detailed analysis and suggestions</p>
        </WorkflowModule>

        {/* Run Button */}
        {uploadedFile && !flowActive && moduleStatuses.analyze === "idle" && (
          <div className="absolute top-8 right-8 animate-scale-in">
            <Button
              size="lg"
              onClick={runWorkflow}
              className="shadow-lg gap-2"
            >
              <Brain className="h-5 w-5" />
              Run Workflow
            </Button>
          </div>
        )}

        {/* Results Panel */}
        {analysis && (
          <div className="absolute inset-x-4 bottom-4 top-80 overflow-auto animate-fade-in">
            <AnalysisResult analysis={analysis} />
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* Animation Styles */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkflowCanvas;
