import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OrderDetails {
  id: string;
  created_at: string;
  total_price: number;
  status: string;
  shipping_addresses: {
    recipient_name: string;
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
}

interface OrderItem {
  quantity: number;
  products: {
    name: string;
    price: number;
    image_url: string;
  };
}

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, shipping_addresses(*)')
          .eq('id', id)
          .single();
        if (error) throw error;
        setOrder(data);
      } catch (error: any) {
        setError(error.message);
      }
    };

    const fetchOrderItems = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('quantity, products!inner(*)')
          .eq('order_id', id);
        if (error) throw error;
        setOrderItems(data || []);
      } catch (error: any) {
        setError(error.message);
      }
    };

    const fetchAll = async () => {
      await Promise.all([fetchOrderDetails(), fetchOrderItems()]);
      setLoading(false);
    };

    fetchAll();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!order) return <div>Order not found.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Order Details</h1>
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Order ID</p>
              <p>{order.id}</p>
            </div>
            <div>
              <p className="font-medium">Order Date</p>
              <p>{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium">Status</p>
              <p>{order.status}</p>
            </div>
            <div>
              <p className="font-medium">Total Price</p>
              <p>${order.total_price.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Customer Name</p>
              <p>{order.shipping_addresses?.recipient_name}</p>
            </div>
            <div>
              <p className="font-medium">Shipping Address</p>
              <p>
                {order.shipping_addresses?.street_address}, {order.shipping_addresses?.city},{' '}
                {order.shipping_addresses?.state} {order.shipping_addresses?.postal_code},{' '}
                {order.shipping_addresses?.country}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <img
                        src={item.products?.image_url}
                        alt={item.products?.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <span>{item.products?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.products?.price.toFixed(2)}</TableCell>
                  <TableCell>${(item.products?.price! * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
