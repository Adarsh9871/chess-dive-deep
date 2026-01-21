-- Create database trigger for auto-creating profiles on signup
-- The function already exists, we just need to attach the trigger

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();