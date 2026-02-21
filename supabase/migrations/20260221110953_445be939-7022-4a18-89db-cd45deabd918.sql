
-- Drop the permissive update policy - edge functions use service_role which bypasses RLS
DROP POLICY "Anyone can update subscribers" ON public.subscribers;

-- Drop the permissive insert policy and make it more restrictive
DROP POLICY "Anyone can insert subscribers" ON public.subscribers;

-- Only allow inserting if the email doesn't already exist as verified
CREATE POLICY "Anon can insert new subscribers"
ON public.subscribers
FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.subscribers s WHERE s.email = email AND s.verified = true
  )
);
