-- Make coach_id nullable in slot_requests so students can book without a pre-assigned coach
ALTER TABLE public.slot_requests ALTER COLUMN coach_id DROP NOT NULL;

-- Update RLS policy to allow students to create requests without coach_id
DROP POLICY IF EXISTS "Students can create slot requests" ON public.slot_requests;
CREATE POLICY "Students can create slot requests" 
ON public.slot_requests 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Add policy for admins to assign coaches to slot requests
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.slot_requests;
CREATE POLICY "Admins can manage all requests" 
ON public.slot_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));