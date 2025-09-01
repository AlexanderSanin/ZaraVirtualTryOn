import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import ResultsGallery from "@/components/results-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { Download, Share2, RotateCcw, ShoppingBag } from "lucide-react";

export default function Results() {
  const { id } = useParams();
  
  const { data: results, isLoading, error } = useQuery({
    queryKey: ['/api/results', id],
    queryFn: () => api.getResults(id!),
    enabled: !!id,
  });

  const handleDownload = () => {
    if (results?.resultUrls?.[0]) {
      const link = document.createElement('a');
      link.href = results.resultUrls[0];
      link.download = 'virtual-tryon-result.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (results?.resultUrls?.[0] && navigator.share) {
      try {
        await navigator.share({
          title: 'My Virtual Try-On Result',
          text: 'Check out how these clothes look on me!',
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Skeleton className="h-8 w-64 mx-auto mb-4" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Skeleton className="aspect-[4/5] rounded-xl" />
              <Skeleton className="aspect-[4/5] rounded-xl" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="pt-8">
                <h2 className="text-2xl font-bold mb-4">Results Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't find the results you're looking for. The job may still be processing or may have failed.
                </p>
                <Link href="/try">
                  <Button>Try Again</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Your Virtual Try-On Results</h2>
            <p className="text-muted-foreground">Here's how the selected items look on you</p>
          </div>

          <ResultsGallery 
            originalUrl={results.originalUrl}
            resultUrls={results.resultUrls}
          />

          {/* Selected Products Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Items Tried On</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="selected-products-summary">
                {results.products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
                    <img 
                      src={product.images[0]} 
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-sm">{product.title}</p>
                      <p className="text-muted-foreground text-xs">
                        €{(product.price / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/try">
              <Button variant="default" className="w-full sm:w-auto" data-testid="button-try-another">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Another Look
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-shop-items">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop These Items
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDownload}
              className="w-full sm:w-auto"
              data-testid="button-download"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Result
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleShare}
              className="w-full sm:w-auto"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
