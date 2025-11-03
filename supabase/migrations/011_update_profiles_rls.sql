-- Drop the old, overly broad SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Create a new policy that allows users to view their own profile
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING ( auth.uid() = id );

-- Re-add the policy for updating, ensuring it's correct
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );
