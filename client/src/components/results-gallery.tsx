import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";

interface ResultsGalleryProps {
  originalUrl: string;
  resultUrls: string[];
}

export default function ResultsGallery({ originalUrl, resultUrls }: ResultsGalleryProps) {
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Virtual Try-On Result',
          text: 'Check out my virtual try-on result!',
          url: url,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(url);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Original Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Original Photo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-[4/5] bg-muted">
            <img 
              src={originalUrl} 
              alt="Original user photo"
              className="w-full h-full object-cover rounded-b-lg"
              data-testid="img-original"
            />
          </div>
        </CardContent>
      </Card>

      {/* Try-On Result */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Virtual Try-On Result</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(resultUrls[0], 'virtual-tryon-result.jpg')}
              data-testid="button-download-result"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare(resultUrls[0])}
              data-testid="button-share-result"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-[4/5] bg-muted">
            <img 
              src={resultUrls[0]} 
              alt="Virtual try-on result"
              className="w-full h-full object-cover rounded-b-lg"
              data-testid="img-result"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
