CREATE VIEW public.orders_with_profile AS
SELECT
  o.*,
  p.full_name
FROM public.orders o
LEFT JOIN public.profiles p ON p.id = o.user_id;
