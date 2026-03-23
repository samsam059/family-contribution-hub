
ALTER TABLE public.members
ADD COLUMN dob date,
ADD COLUMN marital_status text NOT NULL DEFAULT 'single',
ADD COLUMN marriage_date date,
ADD COLUMN profession text,
ADD COLUMN baptized boolean NOT NULL DEFAULT false;
