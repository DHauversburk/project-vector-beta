-- Feedback Table
create table feedback (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) not null,
  rating int check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamptz default now()
);

-- Secure the table
alter table feedback enable row level security;

-- Policies

-- 1. Admins can view all feedback
create policy "Admins View All Feedback"
  on feedback for select
  using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );

-- 2. Providers can view feedback for their appointments
create policy "Providers View Own Feedback"
  on feedback for select
  using (
    exists (
      select 1 from appointments a
      where a.id = feedback.appointment_id
      and a.provider_id = auth.uid()
    )
  );

-- 3. Members can insert feedback for their own *completed* appointments
-- They cannot update or delete it once submitted (Write-Once)
create policy "Members Submit Feedback"
  on feedback for insert
  with check (
    exists (
      select 1 from appointments a
      where a.id = feedback.appointment_id
      and a.member_id = auth.uid()
      -- Optional: Ensure appointment is in the past?
      -- and a.end_time < now() 
    )
  );
