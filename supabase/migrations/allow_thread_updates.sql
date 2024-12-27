-- Add UPDATE policy for conversation_threads
CREATE POLICY "Users can update their own conversation threads"
ON public.conversation_threads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);