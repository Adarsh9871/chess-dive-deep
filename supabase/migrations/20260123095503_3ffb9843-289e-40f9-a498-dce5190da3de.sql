-- Create table for tracking game history with detailed stats
CREATE TABLE public.game_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  opponent_type TEXT NOT NULL DEFAULT 'bot', -- 'bot' or 'human'
  opponent_name TEXT,
  opponent_difficulty TEXT, -- for bot games
  result TEXT NOT NULL, -- 'win', 'loss', 'draw'
  player_color TEXT NOT NULL, -- 'w' or 'b'
  moves_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  fen_final TEXT, -- final position
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for puzzle progress
CREATE TABLE public.puzzle_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  puzzle_id TEXT NOT NULL,
  solved BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 1,
  time_seconds INTEGER,
  stars_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, puzzle_id)
);

-- Create table for video call sessions
CREATE TABLE public.video_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  student_id UUID NOT NULL,
  room_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'active', 'ended'
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzle_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_history
CREATE POLICY "Users can view their own game history" 
ON public.game_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game history" 
ON public.game_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all game history" 
ON public.game_history FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for puzzle_progress
CREATE POLICY "Users can view their own puzzle progress" 
ON public.puzzle_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own puzzle progress" 
ON public.puzzle_progress FOR ALL 
USING (auth.uid() = user_id);

-- RLS policies for video_sessions
CREATE POLICY "Participants can view their video sessions" 
ON public.video_sessions FOR SELECT 
USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "Coaches can create video sessions" 
ON public.video_sessions FOR INSERT 
WITH CHECK (auth.uid() = coach_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Participants can update video sessions" 
ON public.video_sessions FOR UPDATE 
USING (auth.uid() = coach_id OR auth.uid() = student_id);

CREATE POLICY "Admins can manage all video sessions" 
ON public.video_sessions FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));