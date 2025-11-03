import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderHistory from '@/components/OrderHistory';
import ShippingAddressManager from '@/components/ShippingAddress';

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <Tabs defaultValue="order-history">
        <TabsList>
          <TabsTrigger value="order-history">Order History</TabsTrigger>
          <TabsTrigger value="shipping-address">Shipping Address</TabsTrigger>
        </TabsList>
        <TabsContent value="order-history">
          <OrderHistory />
        </TabsContent>
        <TabsContent value="shipping-address">
          <ShippingAddressManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
