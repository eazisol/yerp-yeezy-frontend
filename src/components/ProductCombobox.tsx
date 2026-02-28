import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { productService, Product } from "@/services/products";
import { useDebounce } from "@/hooks/useDebounce";

interface ProductComboboxProps {
  value?: number;
  onSelect: (productId: number) => void;
  placeholder?: string;
  disabled?: boolean;
  vendorId?: number; // Filter products by vendor
}

// Page size for product list in PO form - show all products (backend max 500)
const PRODUCT_LIST_PAGE_SIZE = 500;

/**
 * Searchable product combobox component with server-side search
 * Allows users to search and select products from the database
 */
export function ProductCombobox({
  value,
  onSelect,
  placeholder = "Search products...",
  disabled = false,
  vendorId,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch products when search term changes or when popover opens
  useEffect(() => {
    // Only fetch when popover is open
    if (!open) {
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getProducts(
          1,
          PRODUCT_LIST_PAGE_SIZE,
          debouncedSearchTerm.trim().length > 0 ? debouncedSearchTerm : undefined,
          "true",
          undefined,
          vendorId
        );
        // Sort products A-Z by name for consistent dropdown order
        setProducts(
          [...response.data].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
          )
        );
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedSearchTerm, open, vendorId]);

  // Fetch selected product details when value changes
  useEffect(() => {
    const fetchSelectedProduct = async () => {
      if (value && value > 0) {
        try {
          const product = await productService.getProductById(value);
          // Convert ProductDetail to Product format
          setSelectedProduct({
            productId: product.productId,
            swellProductId: product.swellProductId,
            sku: product.sku,
            name: product.name,
            description: product.description,
            price: product.price,
            comparePrice: product.comparePrice,
            currency: product.currency,
            status: product.status,
            type: product.type,
            isActive: product.isActive,
            origin: product.origin,
            category: product.category,
            createdDate: product.createdDate,
            editDate: product.editDate,
            totalStock: product.inventory?.totalStock || 0,
            availableStock: product.inventory?.availableStock || 0,
            reservedStock: product.inventory?.reservedStock || 0,
            cnStock: product.warehouseInventories?.find(w => w.warehouseCode === "CN")?.availableStock || 0,
            usStock: product.warehouseInventories?.find(w => w.warehouseCode === "US")?.availableStock || 0,
          });
        } catch (error) {
          console.error("Failed to fetch selected product:", error);
          setSelectedProduct(null);
        }
      } else {
        setSelectedProduct(null);
      }
    };

    fetchSelectedProduct();
  }, [value]);

  const handleSelect = (productId: number) => {
    onSelect(productId);
    setOpen(false);
    setSearchTerm(""); // Clear search when item is selected
    setProducts([]); // Clear products list when closed
  };

  // Clear products when popover closes
  useEffect(() => {
    if (!open) {
      setProducts([]);
      setSearchTerm("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedProduct
            ? `${selectedProduct.name} (${selectedProduct.sku})`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Searching...
                </span>
              </div>
            ) : (
              <>
                {products.length === 0 && debouncedSearchTerm.trim().length > 0 ? (
                  <CommandEmpty>No products found.</CommandEmpty>
                ) : products.length === 0 ? (
                  <CommandEmpty>
                    No products available.
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {products.map((product) => (
                      <CommandItem
                        key={product.productId}
                        value={`${product.name} ${product.sku}`}
                        onSelect={() => handleSelect(product.productId)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === product.productId
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

