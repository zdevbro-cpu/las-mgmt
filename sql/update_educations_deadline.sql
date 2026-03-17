-- Add registration_deadline column to educations table
ALTER TABLE public.educations 
ADD COLUMN registration_deadline TIMESTAMP WITH TIME ZONE;
