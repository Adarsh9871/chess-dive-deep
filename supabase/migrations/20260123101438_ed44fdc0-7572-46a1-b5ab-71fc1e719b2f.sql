-- Allow admins to view all scheduled games
CREATE POLICY "Admins can view all scheduled games"
ON public.scheduled_games
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all scheduled games
CREATE POLICY "Admins can update all scheduled games"
ON public.scheduled_games
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete all scheduled games
CREATE POLICY "Admins can delete all scheduled games"
ON public.scheduled_games
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));