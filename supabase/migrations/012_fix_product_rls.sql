-- Step 1: Create a new function to get the user's role from the profiles table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update the RLS policies on the products table to use the new function
-- Drop the old policies first to avoid conflicts
DROP POLICY IF EXISTS "Admins can create products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Create the new, correct policies
CREATE POLICY "Admins can create products"
ON public.products FOR INSERT
WITH CHECK ( public.get_user_role() = 'admin' );

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING ( public.get_user_role() = 'admin' );

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING ( public.get_user_role() = 'admin' );

-- Step 3: Drop the obsolete has_role function
DROP FUNCTION IF EXISTS public.has_role(text);
