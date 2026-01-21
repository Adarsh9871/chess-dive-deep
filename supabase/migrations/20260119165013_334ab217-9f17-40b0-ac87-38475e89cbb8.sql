-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'student');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create classes table for scheduling
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'canceled', 'makeup', 'trial')),
  notes TEXT,
  is_makeup BOOLEAN DEFAULT false,
  original_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Classes RLS
CREATE POLICY "Users can view their own classes"
  ON public.classes FOR SELECT
  USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "Admins can view all classes"
  ON public.classes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can insert classes"
  ON public.classes FOR INSERT
  WITH CHECK (auth.uid() = coach_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can update their classes"
  ON public.classes FOR UPDATE
  USING (auth.uid() = coach_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can delete their classes"
  ON public.classes FOR DELETE
  USING (auth.uid() = coach_id OR public.has_role(auth.uid(), 'admin'));

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_announcement BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages RLS
CREATE POLICY "Users can view their received messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = recipient_id OR (is_announcement = true));

CREATE POLICY "Users can view their sent messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark their messages as read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can send announcements"
  ON public.messages FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND is_announcement = true);

-- Create makeup_requests table
CREATE TABLE public.makeup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.makeup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their makeup requests"
  ON public.makeup_requests FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Coaches can view makeup requests for their classes"
  ON public.makeup_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = original_class_id AND c.coach_id = auth.uid()
  ));

CREATE POLICY "Admins can view all makeup requests"
  ON public.makeup_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create makeup requests"
  ON public.makeup_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can update makeup requests"
  ON public.makeup_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = original_class_id AND c.coach_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_makeup_requests_updated_at
  BEFORE UPDATE ON public.makeup_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add display_name to profiles if user needs it for admin panel
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Update profiles RLS to allow admins to view all
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));