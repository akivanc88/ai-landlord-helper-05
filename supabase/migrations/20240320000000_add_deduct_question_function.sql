CREATE OR REPLACE FUNCTION public.deduct_question(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE question_credits
  SET remaining_questions = remaining_questions - 1
  WHERE user_id = user_id_param
  AND remaining_questions > 0;
END;
$$;