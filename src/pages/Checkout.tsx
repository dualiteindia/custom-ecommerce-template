import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

// Define the type for a shipping address
interface ShippingAddress {
  id: string;
  recipient_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipient_name: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('shipping_addresses')
          .select('*')
          .eq('profile_id', user.id);
        if (error) throw error;
        setAddresses(data || []);
        if (data && data.length > 0) {
          setSelectedAddress(data[0].id);
        } else {
          setShowAddForm(true);
        }
      } catch (error: any) {
        toast.error(error.message);
      }
    };
    fetchAddresses();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to checkout.');
      return;
    }
    setLoading(true);
    try {
      // Create an order
      let addressIdToSave = selectedAddress;

      if (showAddForm) {
        const { data: savedAddress, error: saveError } = await supabase
          .from('shipping_addresses')
          .insert([{ ...newAddress, profile_id: user.id, is_default: saveAddress }])
          .select()
          .single();

        if (saveError) throw saveError;
        addressIdToSave = savedAddress.id;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_price: cartTotal,
          status: 'Pending',
          shipping_address_id: addressIdToSave,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold mb-8 text-center">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Shipping Information</h2>
          {addresses.length > 0 && (
            <RadioGroup value={selectedAddress || ''} onValueChange={setSelectedAddress}>
              {addresses.map((address) => (
                <Label
                  key={address.id}
                  htmlFor={address.id}
                  className="flex items-center space-x-2 border p-4 rounded-md cursor-pointer"
                >
                  <RadioGroupItem value={address.id} id={address.id} />
                  <div>
                    <p className="font-bold">{address.recipient_name}</p>
                    <p>{address.street_address}</p>
                    <p>
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p>{address.country}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          )}

          <Button variant="link" onClick={() => setShowAddForm(!showAddForm)} className="mt-4">
            {showAddForm ? 'Cancel' : 'Add a new address'}
          </Button>

          {showAddForm && (
            <form onSubmit={handleCheckout} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Recipient Name</Label>
                  <Input
                    id="recipient_name"
                    name="recipient_name"
                    value={newAddress.recipient_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street_address">Street Address</Label>
                  <Input
                    id="street_address"
                    name="street_address"
                    value={newAddress.street_address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={newAddress.city} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" value={newAddress.state} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={newAddress.postal_code}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={newAddress.country}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="save-address" checked={saveAddress} onCheckedChange={(checked: boolean) => setSaveAddress(checked)} />
                <Label htmlFor="save-address">Save this address for future use</Label>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={loading || cart.length === 0}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </form>
          )}
          {!showAddForm && (
            <Button
              onClick={() => handleCheckout()}
              className="w-full h-12 text-lg mt-4"
              disabled={loading || cart.length === 0 || !selectedAddress}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </Button>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <ul>
                {cart.map((item: any) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <hr />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
