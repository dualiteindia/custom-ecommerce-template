-- Assign the 'admin' role to a specific user
-- Replace 'YOUR_USER_ID' with the actual user ID
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
