import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/product-card";
import { api } from "@/lib/api";
import { Search } from "lucide-react";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  onSelectionChange: (products: Product[]) => void;
  maxSelection?: number;
}

export default function ProductGrid({ onSelectionChange, maxSelection = 3 }: ProductGridProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState({
    category: 'all',
    gender: 'all',
    search: '',
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['/api/products', filters],
    queryFn: () => api.getProducts(filters),
  });

  useEffect(() => {
    onSelectionChange(selectedProducts);
  }, [selectedProducts, onSelectionChange]);

  const handleProductToggle = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= maxSelection) {
          return prev; // Don't add if at max
        }
        return [...prev, product];
      }
    });
  };

  const isProductSelected = (productId: string) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-64" />
            </div>
          </CardContent>
        </Card>
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-[3/4] w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const products = productsData?.items || [];

  return (
    <div className="space-y-8">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="w-40" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="jackets">Jackets</SelectItem>
                  <SelectItem value="shirts">Shirts</SelectItem>
                  <SelectItem value="dresses">Dresses</SelectItem>
                  <SelectItem value="sweaters">Sweaters</SelectItem>
                  <SelectItem value="knitwear">Knitwear</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="basics">Basics</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                <SelectTrigger className="w-40" data-testid="select-gender">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Selected:</span>
              <Badge variant="secondary" data-testid="badge-selected-count">
                {selectedProducts.length}/{maxSelection}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="products-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={isProductSelected(product.id)}
            onToggle={() => handleProductToggle(product)}
            disabled={!isProductSelected(product.id) && selectedProducts.length >= maxSelection}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
