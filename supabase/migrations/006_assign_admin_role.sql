-- Assign the 'admin' role to a specific user
-- Replace 'YOUR_USER_ID' with the actual user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
