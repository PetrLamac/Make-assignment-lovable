import { useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  analyzing: boolean;
}

const UploadZone = ({ onFileSelect, analyzing }: UploadZoneProps) => {
  const { toast } = useToast();

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      
      const file = e.dataTransfer.files[0];
      if (!file) return;

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

      onFileSelect(file);
    },
    [onFileSelect, toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Card
      className="relative border-2 border-dashed border-border hover:border-primary/50 transition-colors"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center p-12 cursor-pointer"
      >
        {analyzing ? (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              Analyzing image...
            </p>
            <p className="text-sm text-muted-foreground">
              This may take a few moments
            </p>
          </>
        ) : (
          <>
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">
              Drop an error screenshot here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse (PNG, JPEG • Max 15 MB)
            </p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 bg-muted rounded">English text</span>
              <span className="px-2 py-1 bg-muted rounded">Screenshots only</span>
            </div>
          </>
        )}
      </label>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="image/png,image/jpeg"
        onChange={handleFileInput}
        disabled={analyzing}
      />
    </Card>
  );
};

export default UploadZone;
