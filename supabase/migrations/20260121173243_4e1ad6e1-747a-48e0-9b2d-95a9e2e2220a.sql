-- Add email column to profiles for notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_notifications boolean DEFAULT false;

-- Create coach_student_assignments table for 1-on-1 teaching relationships
CREATE TABLE public.coach_student_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL,
  student_id uuid NOT NULL,
  assigned_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(coach_id, student_id)
);

-- Enable RLS
ALTER TABLE public.coach_student_assignments ENABLE ROW LEVEL SECURITY;

-- Create coach_availability table for coaches to set their available slots
CREATE TABLE public.coach_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;

-- Create slot_requests table for students to request available slots
CREATE TABLE public.slot_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  requested_date date NOT NULL,
  requested_time text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slot_requests ENABLE ROW LEVEL SECURITY;

-- Create notifications table to track sent notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  sms_sent boolean DEFAULT false,
  related_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_student_assignments
CREATE POLICY "Admins can manage all assignments"
ON public.coach_student_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Coaches can view their assignments"
ON public.coach_student_assignments
FOR SELECT
USING (auth.uid() = coach_id);

CREATE POLICY "Students can view their assignments"
ON public.coach_student_assignments
FOR SELECT
USING (auth.uid() = student_id);

-- RLS Policies for coach_availability
CREATE POLICY "Coaches can manage their availability"
ON public.coach_availability
FOR ALL
USING (auth.uid() = coach_id);

CREATE POLICY "Students can view coach availability"
ON public.coach_availability
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.coach_student_assignments
  WHERE coach_student_assignments.coach_id = coach_availability.coach_id
  AND coach_student_assignments.student_id = auth.uid()
  AND coach_student_assignments.status = 'active'
));

CREATE POLICY "Admins can manage all availability"
ON public.coach_availability
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for slot_requests
CREATE POLICY "Students can create slot requests"
ON public.slot_requests
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their requests"
ON public.slot_requests
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Coaches can view requests for their slots"
ON public.slot_requests
FOR SELECT
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update requests"
ON public.slot_requests
FOR UPDATE
USING (auth.uid() = coach_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all requests"
ON public.slot_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_coach_student_assignments_updated_at
BEFORE UPDATE ON public.coach_student_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slot_requests_updated_at
BEFORE UPDATE ON public.slot_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();