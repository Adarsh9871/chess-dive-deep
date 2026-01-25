-- Create programs table for chess programs/courses
CREATE TABLE public.programs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    is_subscription BOOLEAN DEFAULT false,
    subscription_interval TEXT, -- 'monthly', 'yearly'
    features JSONB DEFAULT '[]'::jsonb,
    level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
    duration_weeks INTEGER,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blogs table
CREATE TABLE public.blogs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image_url TEXT,
    author_id UUID NOT NULL,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    video_url TEXT,
    attachment_urls TEXT[] DEFAULT '{}',
    order_index INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    is_free BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '[]'::jsonb,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, past_due
    billing_interval TEXT DEFAULT 'monthly', -- monthly, yearly
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment history table
CREATE TABLE public.payment_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
    payment_type TEXT NOT NULL, -- subscription, one_time, refund
    description TEXT,
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin settings table
CREATE TABLE public.admin_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user program purchases table
CREATE TABLE public.user_program_purchases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payment_history(id),
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, program_id)
);

-- Create lesson progress table
CREATE TABLE public.lesson_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    progress_percent INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_program_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Programs policies
CREATE POLICY "Anyone can view active programs" ON public.programs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage programs" ON public.programs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Blogs policies
CREATE POLICY "Anyone can view published blogs" ON public.blogs FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage blogs" ON public.blogs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Lessons policies
CREATE POLICY "Users can view free or purchased lessons" ON public.lessons FOR SELECT 
USING (
    is_free = true 
    OR is_published = false 
    OR EXISTS (
        SELECT 1 FROM public.user_program_purchases 
        WHERE user_id = auth.uid() AND program_id = lessons.program_id
    )
    OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Subscription plans policies
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User subscriptions policies
CREATE POLICY "Users can view their subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Payment history policies
CREATE POLICY "Users can view their payments" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payment_history FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert payments" ON public.payment_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin settings policies
CREATE POLICY "Admins can manage settings" ON public.admin_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User program purchases policies
CREATE POLICY "Users can view their purchases" ON public.user_program_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage purchases" ON public.user_program_purchases FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert purchases" ON public.user_program_purchases FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Lesson progress policies
CREATE POLICY "Users can manage their progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.lesson_progress FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Create update triggers
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, is_popular) VALUES
('Free', 'Basic access to learn chess', 0, 0, '["Access to free lessons", "Play against basic bots", "Join community forums"]'::jsonb, false),
('Pro', 'Everything you need to improve', 9.99, 99.99, '["All free features", "Unlimited lessons access", "Advanced bot opponents", "1-on-1 coaching sessions", "Progress analytics"]'::jsonb, true),
('Premium', 'For serious chess players', 19.99, 199.99, '["All Pro features", "Priority coach booking", "Exclusive masterclasses", "Tournament access", "Personal coach assignment"]'::jsonb, false);

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
('site_name', '"ChessPals"', 'Website name'),
('site_description', '"Learn chess with personalized coaching"', 'Website description'),
('contact_email', '"support@chesspals.com"', 'Contact email address'),
('maintenance_mode', 'false', 'Enable maintenance mode'),
('allow_registrations', 'true', 'Allow new user registrations'),
('default_session_duration', '60', 'Default coaching session duration in minutes'),
('booking_advance_days', '30', 'How many days in advance users can book');

-- Create storage bucket for content uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', true) ON CONFLICT DO NOTHING;

-- Storage policies for content bucket
CREATE POLICY "Anyone can view content files" ON storage.objects FOR SELECT USING (bucket_id = 'content');
CREATE POLICY "Admins can upload content" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'content' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update content" ON storage.objects FOR UPDATE USING (bucket_id = 'content' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete content" ON storage.objects FOR DELETE USING (bucket_id = 'content' AND has_role(auth.uid(), 'admin'));