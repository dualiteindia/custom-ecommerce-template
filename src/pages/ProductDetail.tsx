import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          throw error;
        }
        setProduct(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !product) {
    return <div>Error: {error || 'Product not found'}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.image_url}
            alt={product.name}
            className="rounded-lg shadow-lg"
          />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold mb-4">{product.name}</h1>
          <p className="text-3xl font-bold mb-4">${product.price}</p>
          <p className="text-lg mb-8">{product.description}</p>
          <Button onClick={() => addToCart(product)} size="lg">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
