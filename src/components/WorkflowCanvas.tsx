import { useState, useRef } from "react";
import { Upload, Brain, RotateCcw, Play, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import WorkflowModule from "./WorkflowModule";
import { supabase } from "@/integrations/supabase/client";

const WorkflowCanvas = () => {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [moduleStatuses, setModuleStatuses] = useState({
    upload: "idle" as "idle" | "active" | "complete" | "error",
    analyze: "idle" as "idle" | "active" | "complete" | "error",
  });
  const [flowActive, setFlowActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetWorkflow = () => {
    setUploadedFile(null);
    setUploadedImageUrl(null);
    setImageUrlInput("");
    setInputMode("file");
    setModuleStatuses({
      upload: "idle",
      analyze: "idle",
    });
    setFlowActive(false);
  };

  const handleUrlSubmit = () => {
    if (!imageUrlInput.trim()) {
      toast({
        title: "Empty URL",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrlInput);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
      return;
    }

    setUploadedImageUrl(imageUrlInput);
    setUploadedFile(null);
    setModuleStatuses({
      upload: "complete",
      analyze: "idle",
    });
    setFlowActive(false);
  };

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
    });
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
    if (!uploadedFile && !uploadedImageUrl) return;

    setFlowActive(true);
    setModuleStatuses({
      upload: "complete",
      analyze: "active",
    });

    try {
      // Prepare form data
      const formData = new FormData();
      if (uploadedFile) {
        formData.append("file", uploadedFile);
      } else if (uploadedImageUrl) {
        formData.append("imageUrl", uploadedImageUrl);
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: formData,
      });

      if (error) throw error;

      // Update to complete
      setModuleStatuses({
        upload: "complete",
        analyze: "complete",
      });

      setFlowActive(false);

      toast({
        title: "Analysis Complete",
        description: "Image analyzed and saved to history",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      setModuleStatuses({
        upload: "complete",
        analyze: "error",
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
    <div className="relative w-full h-[calc(100vh-12rem)] bg-gradient-to-br from-background to-muted/30 rounded-lg overflow-hidden border border-border">
      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
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
            <linearGradient id="lineGradientActive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="lineGradientComplete" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="1" />
            </linearGradient>
          </defs>
          
          {/* Upload to Analyze Connection */}
          <line
            x1="230"
            y1="200"
            x2="470"
            y2="200"
            stroke={moduleStatuses.analyze !== "idle" ? "url(#lineGradientComplete)" : "hsl(var(--muted))"}
            strokeWidth="3"
            className="transition-all duration-500"
            strokeDasharray={flowActive && moduleStatuses.analyze === "active" ? "8,8" : "0"}
            style={{
              animation: flowActive && moduleStatuses.analyze === "active" 
                ? "dash 1s linear infinite" 
                : "none"
            }}
          />
        </svg>

        {/* Modules */}
        <WorkflowModule
          id="upload"
          title="Select Image"
          icon={<Upload className="h-8 w-8" />}
          status={moduleStatuses.upload}
          position={{ x: 180, y: 200 }}
          hasInput={false}
          hasOutput={true}
        >
          {!uploadedFile && !uploadedImageUrl ? (
            <div className="space-y-3">
              <div className="flex gap-2 mb-2">
                <Button
                  size="sm"
                  variant={inputMode === "file" ? "default" : "outline"}
                  onClick={() => setInputMode("file")}
                  className="flex-1"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  File
                </Button>
                <Button
                  size="sm"
                  variant={inputMode === "url" ? "default" : "outline"}
                  onClick={() => setInputMode("url")}
                  className="flex-1"
                >
                  <Link className="h-3 w-3 mr-1" />
                  URL
                </Button>
              </div>
              
              {inputMode === "file" ? (
                <div className="text-center">
                  <p className="mb-2 text-xs">Drop image or click to browse</p>
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
                <div className="space-y-2">
                  <Input
                    placeholder="Enter image URL"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleUrlSubmit}
                    className="w-full"
                  >
                    Load Image
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <img 
                src={uploadedImageUrl!} 
                alt="Selected" 
                className="w-full h-24 object-cover rounded mb-2"
              />
              <p className="text-xs truncate">
                {uploadedFile ? uploadedFile.name : "Image from URL"}
              </p>
            </div>
          )}
        </WorkflowModule>

        <WorkflowModule
          id="analyze"
          title="AI Image Analyzer"
          icon={<Brain className="h-8 w-8" />}
          status={moduleStatuses.analyze}
          position={{ x: 550, y: 200 }}
          hasInput={true}
          hasOutput={false}
        >
          <p>Analyzes error screenshots using AI vision</p>
        </WorkflowModule>

        {/* Action Buttons */}
        <div className="absolute top-8 right-8 flex gap-3 animate-fade-in">
          {(uploadedFile || uploadedImageUrl) && !flowActive && moduleStatuses.analyze === "idle" && (
            <Button
              size="lg"
              onClick={runWorkflow}
              className="shadow-lg gap-2 bg-[hsl(270,70%,55%)] hover:bg-[hsl(270,70%,50%)]"
            >
              <Play className="h-5 w-5" />
              Run Workflow
            </Button>
          )}
          
          {moduleStatuses.analyze === "complete" && (
            <Button
              size="lg"
              variant="outline"
              onClick={resetWorkflow}
              className="shadow-lg gap-2 animate-scale-in"
            >
              <RotateCcw className="h-5 w-5" />
              Reset
            </Button>
          )}
        </div>
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
