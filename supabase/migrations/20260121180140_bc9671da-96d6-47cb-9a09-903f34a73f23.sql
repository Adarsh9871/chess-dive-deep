-- Add meet_link column to classes table for Google Meet integration
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS meet_link text;

-- Add coach profiles view for easier querying (students can see their coach info)
CREATE POLICY "Students can view their coach profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM coach_student_assignments csa
    WHERE csa.coach_id = profiles.user_id 
    AND csa.student_id = auth.uid()
    AND csa.status = 'active'
  )
);

-- Coaches can view their student profiles
CREATE POLICY "Coaches can view their student profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM coach_student_assignments csa
    WHERE csa.student_id = profiles.user_id 
    AND csa.coach_id = auth.uid()
    AND csa.status = 'active'
  )
);