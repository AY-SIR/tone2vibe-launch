
-- Subscribers table
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT false,
  otp_code TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert (for new signups)
CREATE POLICY "Anyone can insert subscribers"
ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Allow anon to select (to check existence)
CREATE POLICY "Anyone can check subscriber existence"
ON public.subscribers
FOR SELECT
USING (true);

-- Allow anon to update (for OTP verification via edge function only - service role used there)
CREATE POLICY "Anyone can update subscribers"
ON public.subscribers
FOR UPDATE
USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
