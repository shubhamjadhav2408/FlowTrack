-- Replace 'YOUR_USER_ID' with your actual Supabase auth.users ID.
-- You can find your user ID in the Supabase Dashboard -> Authentication -> Users.

INSERT INTO public.categories (user_id, name, type, emoji, color) VALUES
  ('YOUR_USER_ID', 'Rent', 'expense', '🏠', '#8B7CF6'),
  ('YOUR_USER_ID', 'HMRC Taxes', 'expense', '🏛️', '#FF6B6B'),
  ('YOUR_USER_ID', 'Groceries', 'expense', '🛒', '#4ECDC4'),
  ('YOUR_USER_ID', 'Dining', 'expense', '🍽️', '#FFE66D'),
  ('YOUR_USER_ID', 'Transport', 'expense', '🚆', '#1A535C'),
  ('YOUR_USER_ID', 'Utilities', 'expense', '⚡', '#FF9F1C'),
  ('YOUR_USER_ID', 'Salary', 'income', '💰', '#2EC4B6'),
  ('YOUR_USER_ID', 'Freelance', 'income', '💻', '#33658A');
