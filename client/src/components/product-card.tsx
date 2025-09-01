import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function ProductCard({ product, isSelected, onToggle, disabled }: ProductCardProps) {
  return (
    <Card 
      className={`overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative ${
        isSelected ? 'ring-2 ring-primary' : 'hover:scale-105'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onToggle}
      data-testid={`card-product-${product.id}`}
    >
      <div className="aspect-[3/4] relative">
        <img 
          src={product.images[0]} 
          alt={product.title}
          className="w-full h-full object-cover"
        />
        
        {/* Selection Overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/90 flex items-center justify-center transition-opacity duration-300">
            <Check className="w-8 h-8 text-white" />
          </div>
        )}
        
        {/* Disabled Overlay */}
        {disabled && !isSelected && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Badge variant="secondary" className="bg-white/90 text-black">
              Max 3 items
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2" data-testid={`text-product-title-${product.id}`}>
          {product.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-2 capitalize">
          {product.gender ? `${product.gender}'s ` : ''}{product.category}
        </p>
        <p className="font-bold text-lg" data-testid={`text-product-price-${product.id}`}>
          €{(product.price / 100).toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Available in {product.sizes.join(', ')}
        </p>
      </CardContent>
    </Card>
  );
}
