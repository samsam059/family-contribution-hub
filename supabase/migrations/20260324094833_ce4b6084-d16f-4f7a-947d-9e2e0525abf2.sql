ALTER TABLE public.members ADD COLUMN IF NOT EXISTS relation text NOT NULL DEFAULT 'other';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS entry_user_id uuid;