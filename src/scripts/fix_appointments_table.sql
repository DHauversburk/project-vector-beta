-- 1. Create appointments table if it doesn't exist
create table if not exists appointments (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references users(id) not null,
  member_id uuid references users(id) not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text check (status in ('pending', 'confirmed', 'cancelled', 'completed')) default 'pending',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table appointments enable row level security;

-- 3. Drop existing policies to avoid conflicts during re-runs
drop policy if exists "Members can view own appointments." on appointments;
drop policy if exists "Providers can view assigned appointments." on appointments;
drop policy if exists "Members can create appointments." on appointments;
drop policy if exists "Providers can update assigned appointments." on appointments;
drop policy if exists "Admins can view all appointments." on appointments;
drop policy if exists "Admins can update all appointments." on appointments;

-- 4. Re-create Policies

-- Members can view their own appointments
create policy "Members can view own appointments." on appointments
  for select using (auth.uid() = member_id);

-- Providers can view appointments assigned to them
create policy "Providers can view assigned appointments." on appointments
  for select using (auth.uid() = provider_id);

-- Members can create appointments
create policy "Members can create appointments." on appointments
  for insert with check (auth.uid() = member_id);

-- Providers can update status of their appointments
create policy "Providers can update assigned appointments." on appointments
  for update using (auth.uid() = provider_id);

-- Admins can view all appointments
create policy "Admins can view all appointments." on appointments
  for select using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Admins can update all appointments
create policy "Admins can update all appointments." on appointments
  for update using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );
