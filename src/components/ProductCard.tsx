import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/contexts/CartContext";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <Link to={`/products/${product.id}`}>
      <Card className="w-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="p-0">
          <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-semibold mb-2">{product.name}</CardTitle>
          <p className="text-xl font-bold mb-4">${product.price}</p>
          <Button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="w-full"
          >
            Add to Cart
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
