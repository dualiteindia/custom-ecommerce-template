-- 1. Enable RLS on the products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that allows public read access
CREATE POLICY "Public products are viewable by everyone"
ON public.products FOR SELECT
USING ( true );

-- 3. Allow admins to insert new products
CREATE POLICY "Admins can create products"
ON public.products FOR INSERT
WITH CHECK ( public.has_role('admin') );

-- 4. Allow admins to update existing products
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING ( public.has_role('admin') );

-- 5. Allow admins to delete products
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING ( public.has_role('admin') );
