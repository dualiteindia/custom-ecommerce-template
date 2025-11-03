-- Create a function to get total sales
CREATE OR REPLACE FUNCTION public.get_total_sales()
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(total_price), 0) INTO total
  FROM public.orders;
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the total number of orders
CREATE OR REPLACE FUNCTION public.get_total_orders()
RETURNS integer AS $$
DECLARE
  total integer;
BEGIN
  SELECT COALESCE(COUNT(*), 0) INTO total
  FROM public.orders;
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the total number of customers
CREATE OR REPLACE FUNCTION public.get_total_customers()
RETURNS integer AS $$
DECLARE
  total integer;
BEGIN
  SELECT COALESCE(COUNT(*), 0) INTO total
  FROM public.profiles
  WHERE role = 'customer';
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
