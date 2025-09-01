import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function SimpleTryOn() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clothingUrl, setClothingUrl] = useState("");
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Please select an image or video file');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setUploadedImageUrl(previewUrl);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.url;
  };

  const createTryOnJob = async (userImageUrl: string, clothingImageUrl: string): Promise<string> => {
    const response = await fetch('/api/tryon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userImageUrl,
        clothingImageUrl,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create try-on job');
    }
    
    const data = await response.json();
    return data.jobId;
  };

  const pollJobStatus = async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get job status');
    }
    
    return response.json();
  };

  const handleTryOn = async () => {
    if (!selectedFile || !clothingUrl) {
      setError('Please select a file and enter a clothing image URL');
      return;
    }

    try {
      setStatus('uploading');
      setError(null);
      
      // Upload user image first
      const userImageUrl = await uploadFile(selectedFile);
      
      setStatus('processing');
      
      // Create try-on job
      const newJobId = await createTryOnJob(userImageUrl, clothingUrl);
      setJobId(newJobId);
      
      // Start polling
      const pollInterval = setInterval(async () => {
        try {
          const jobStatus = await pollJobStatus(newJobId);
          
          if (jobStatus.status === 'completed') {
            clearInterval(pollInterval);
            setStatus('completed');
            setResultUrl(jobStatus.resultUrl);
          } else if (jobStatus.status === 'failed') {
            clearInterval(pollInterval);
            setStatus('failed');
            setError('Try-on processing failed');
          }
        } catch (error) {
          clearInterval(pollInterval);
          setStatus('failed');
          setError('Failed to check job status');
        }
      }, 3000); // Poll every 3 seconds
      
    } catch (error: any) {
      setStatus('failed');
      setError(error.message || 'An error occurred');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setClothingUrl("");
    setStatus('idle');
    setJobId(null);
    setResultUrl(null);
    setError(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Virtual Try-On</h1>
          <p className="text-gray-600">Upload your photo and try on clothing items</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Upload & Configure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Your Photo or Video</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file"
                  />
                  {!selectedFile ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer space-y-2"
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload image or video</p>
                      <p className="text-xs text-gray-500">JPG, PNG, MP4, MOV up to 10MB</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {uploadedImageUrl && (
                        <img 
                          src={uploadedImageUrl} 
                          alt="Preview" 
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                          data-testid="img-preview"
                        />
                      )}
                      <p className="text-sm font-medium text-gray-900" data-testid="text-filename">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-change-file"
                      >
                        Change File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Clothing URL Input */}
              <div className="space-y-2">
                <Label htmlFor="clothing-url">Clothing Image URL</Label>
                <Input
                  id="clothing-url"
                  type="url"
                  placeholder="https://example.com/clothing-item.jpg"
                  value={clothingUrl}
                  onChange={(e) => setClothingUrl(e.target.value)}
                  data-testid="input-clothing-url"
                />
                <p className="text-xs text-gray-500">
                  Enter a direct URL to a Zara product image
                </p>
              </div>

              {/* Try On Button */}
              <Button 
                onClick={handleTryOn}
                disabled={!selectedFile || !clothingUrl || status === 'uploading' || status === 'processing'}
                className="w-full"
                data-testid="button-try-on"
              >
                {status === 'uploading' && (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                )}
                {status === 'processing' && (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                )}
                {(status === 'idle' || status === 'completed' || status === 'failed') && (
                  'Try On'
                )}
              </Button>

              {/* Reset Button */}
              {(status === 'completed' || status === 'failed') && (
                <Button 
                  variant="outline"
                  onClick={resetForm}
                  className="w-full"
                  data-testid="button-reset"
                >
                  Try Another
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              {status === 'idle' && (
                <div className="text-center py-12 text-gray-500">
                  <Upload className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p>Upload your photo and enter a clothing URL to get started</p>
                </div>
              )}

              {(status === 'uploading' || status === 'processing') && (
                <div className="text-center py-12 space-y-4">
                  <Loader2 className="mx-auto h-16 w-16 text-blue-500 animate-spin" />
                  <div className="space-y-2">
                    <p className="font-medium">
                      {status === 'uploading' ? 'Uploading your photo...' : 'Generating virtual try-on...'}
                    </p>
                    <Progress value={status === 'uploading' ? 30 : 70} className="w-full" />
                    {jobId && (
                      <p className="text-xs text-gray-500" data-testid="text-job-id">
                        Job ID: {jobId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {status === 'completed' && resultUrl && (
                <div className="text-center space-y-4">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                  <p className="font-medium text-green-700">Try-on completed successfully!</p>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <img 
                      src={resultUrl} 
                      alt="Virtual try-on result" 
                      className="max-w-full h-auto rounded-lg mx-auto"
                      data-testid="img-result"
                    />
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = resultUrl;
                      link.download = 'virtual-tryon-result.jpg';
                      link.click();
                    }}
                    data-testid="button-download-result"
                  >
                    Download Result
                  </Button>
                </div>
              )}

              {status === 'failed' && (
                <div className="text-center py-12 space-y-4">
                  <XCircle className="mx-auto h-16 w-16 text-red-500" />
                  <div className="space-y-2">
                    <p className="font-medium text-red-700">Try-on failed</p>
                    {error && (
                      <Alert className="text-left">
                        <AlertDescription data-testid="text-error">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}