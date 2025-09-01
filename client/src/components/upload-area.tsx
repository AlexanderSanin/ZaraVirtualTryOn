import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Upload, X, Check } from "lucide-react";
import type { UploadSession } from "@/lib/types";

interface UploadAreaProps {
  onUploadSuccess: (session: UploadSession) => void;
}

export default function UploadArea({ onUploadSuccess }: UploadAreaProps) {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: api.uploadPhoto,
    onSuccess: (data) => {
      onUploadSuccess(data);
      toast({
        title: "Upload successful",
        description: "Your photo has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload your photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleFile = (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeUpload = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = () => {
    if (uploadedFile) {
      uploadMutation.mutate(uploadedFile);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary'
            } bg-muted/30`}
            data-testid="upload-area"
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop your photo here' : 'Drop your photo here or click to browse'}
                </p>
                <p className="text-muted-foreground">Supports JPG, PNG up to 10MB</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-secondary rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg"
                      data-testid="img-preview"
                    />
                  )}
                  <div>
                    <p className="font-medium" data-testid="text-filename">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-filesize">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeUpload}
                  className="text-destructive hover:text-destructive"
                  data-testid="button-remove-upload"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadMutation.isPending && (
              <div className="space-y-2">
                <Progress value={50} />
                <p className="text-sm text-muted-foreground text-center">Uploading...</p>
              </div>
            )}

            {/* Success State */}
            {uploadMutation.isSuccess && (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Upload complete!</span>
              </div>
            )}

            {/* Upload Button */}
            {!uploadMutation.isSuccess && (
              <Button 
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="w-full"
                data-testid="button-upload"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Continue to Browse Products'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
