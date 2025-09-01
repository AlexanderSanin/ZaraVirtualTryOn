import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import UploadArea from "@/components/upload-area";
import ProductGrid from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product, UploadSession } from "@/lib/types";

export default function TryOn() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'select' | 'processing'>('upload');
  const [uploadSession, setUploadSession] = useState<UploadSession | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productImageUrl, setProductImageUrl] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  const createTryOnMutation = useMutation({
    mutationFn: api.createTryOnJob,
    onSuccess: (data) => {
      // Start polling for job completion
      pollJobStatus(data.jobId);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start try-on process",
        variant: "destructive",
      });
      setStep('select');
    }
  });

  const pollJobStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const job = await api.getJobStatus(jobId);
        
        if (job.status === 'processing') {
          setProcessingProgress(prev => Math.min(prev + 10, 90));
        } else if (job.status === 'succeeded') {
          clearInterval(interval);
          setProcessingProgress(100);
          setTimeout(() => {
            navigate(`/results/${jobId}`);
          }, 1000);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          toast({
            title: "Processing Failed",
            description: "Something went wrong during processing. Please try again.",
            variant: "destructive",
          });
          setStep('select');
        }
      } catch (error) {
        clearInterval(interval);
        toast({
          title: "Error",
          description: "Failed to check processing status",
          variant: "destructive",
        });
        setStep('select');
      }
    }, 1000);
  };

  const handleUploadSuccess = (session: UploadSession) => {
    setUploadSession(session);
    setStep('select');
  };

  const handleProductSelect = (products: Product[]) => {
    setSelectedProducts(products);
  };

  const handleGenerateTryOn = () => {
    if (!uploadSession) return;
    
    let finalProductUrl = productImageUrl;
    if (!finalProductUrl && selectedProducts.length > 0) {
      finalProductUrl = selectedProducts[0].images[0];
    }
    
    if (!finalProductUrl) return;

    setStep('processing');
    setProcessingProgress(20);
    
    createTryOnMutation.mutate({
      assetUrl: uploadSession.url,
      productImageUrl: finalProductUrl,
      mode: 'image',
    });
  };

  const processingSteps = [
    'Analyzing your photo...',
    'Detecting body landmarks...',
    'Processing clothing items...',
    'Generating virtual try-on...',
    'Finalizing composition...'
  ];

  const currentStepIndex = Math.floor((processingProgress / 100) * processingSteps.length);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {step === 'upload' && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Upload Your Photo</h2>
              <p className="text-muted-foreground">Upload a clear photo of yourself to get started</p>
            </div>
            
            <UploadArea onUploadSuccess={handleUploadSuccess} />
          </div>
        </section>
      )}

      {step === 'select' && (
        <section className="py-16 px-4 bg-secondary/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Choose Your Product</h2>
              <p className="text-muted-foreground">Browse our collection or enter a direct product image URL</p>
            </div>

            <Tabs defaultValue="browse" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="browse" data-testid="tab-browse">Browse Collection</TabsTrigger>
                <TabsTrigger value="url" data-testid="tab-url">Enter Product URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="browse" className="space-y-8">
                <ProductGrid 
                  onSelectionChange={handleProductSelect}
                  maxSelection={1}
                />
              </TabsContent>
              
              <TabsContent value="url" className="space-y-8">
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Label htmlFor="product-url">Product Image URL</Label>
                      <Input
                        id="product-url"
                        type="url"
                        placeholder="https://example.com/product-image.jpg"
                        value={productImageUrl}
                        onChange={(e) => setProductImageUrl(e.target.value)}
                        data-testid="input-product-url"
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter a direct URL to any product image you'd like to try on
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="text-center mt-8">
              <Button 
                onClick={handleGenerateTryOn}
                disabled={(selectedProducts.length === 0 && !productImageUrl) || createTryOnMutation.isPending}
                size="lg"
                className="px-8"
                data-testid="button-generate-tryon"
              >
                {(selectedProducts.length === 0 && !productImageUrl)
                  ? 'Select a Product or Enter URL to Continue'
                  : 'Generate Virtual Try-On'
                }
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 'processing' && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="pt-8">
                <div className="mb-8">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Creating Your Virtual Try-On</h2>
                  <p className="text-muted-foreground">Please wait while we process your image...</p>
                </div>
                
                <Progress value={processingProgress} className="mb-4" />
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div data-testid="text-processing-status">
                    {processingSteps[currentStepIndex] || 'Processing...'}
                  </div>
                  <div className="text-xs">This usually takes 30-60 seconds</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
