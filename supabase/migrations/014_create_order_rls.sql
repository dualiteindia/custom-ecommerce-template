-- Enable RLS for orders and order_items tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for the orders table
CREATE POLICY "Admins can manage all orders."
ON public.orders FOR ALL
USING ( public.get_user_role() = 'admin' );

CREATE POLICY "Users can view their own orders."
ON public.orders FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Users can create their own orders."
ON public.orders FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- Policies for the order_items table
CREATE POLICY "Admins can manage all order items."
ON public.order_items FOR ALL
USING ( public.get_user_role() = 'admin' );

CREATE POLICY "Users can view items in their own orders."
ON public.order_items FOR SELECT
USING ( EXISTS (
  SELECT 1
  FROM public.orders
  WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can insert items into their own orders."
ON public.order_items FOR INSERT
WITH CHECK ( EXISTS (
  SELECT 1
  FROM public.orders
  WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
));
