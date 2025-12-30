
-- Atomic Rescheduling ("Swap Mode") for Supply-First Architecture
create or replace function reschedule_appointment_swap(
  p_old_appointment_id uuid,
  p_new_appointment_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_member_id uuid;
begin
  -- 1. Verify existence and ownership of the OLD appointment
  select member_id into v_member_id
  from appointments 
  where id = p_old_appointment_id 
  and member_id = auth.uid()
  and status not in ('cancelled', 'completed');

  if v_member_id is null then
    raise exception 'Old appointment not found or not eligible for swapping';
  end if;

  -- 2. Verify the NEW appointment is actually OPEN
  if not exists (
      select 1 from appointments
      where id = p_new_appointment_id
      and member_id is null
      and is_booked = false
  ) then
    raise exception 'Target slot is no longer available';
  end if;

  -- 3. Atomically swap
  -- Release old
  update appointments
  set 
    member_id = null,
    is_booked = false,
    status = 'pending'
  where id = p_old_appointment_id;

  -- Claim new
  update appointments
  set 
    member_id = auth.uid(),
    is_booked = true,
    status = 'pending'
  where id = p_new_appointment_id;

  return json_build_object(
    'success', true,
    'old_id', p_old_appointment_id,
    'new_id', p_new_appointment_id
  );
exception when others then
  return json_build_object(
    'success', false,
    'error', SQLERRM
  );
end;
$$;
