-- Atomic Rescheduling Function
create or replace function reschedule_appointment(
  old_appointment_id uuid,
  new_provider_id uuid,
  new_start_time timestamp with time zone,
  new_end_time timestamp with time zone,
  new_notes text default null
)
returns json
language plpgsql
security definer
as $$
declare
  new_appointment_id uuid;
  old_appt_exists boolean;
begin
  -- 1. Verify ownership of the old appointment
  select exists(
    select 1 from appointments 
    where id = old_appointment_id 
    and member_id = auth.uid()
    and status != 'cancelled'
  ) into old_appt_exists;

  if not old_appt_exists then
    raise exception 'Appointment not found or not eligible for rescheduling';
  end if;

  -- 2. Cancel the old appointment
  update appointments
  set status = 'cancelled'
  where id = old_appointment_id;

  -- 3. Create the new appointment
  insert into appointments (
    provider_id,
    member_id,
    start_time,
    end_time,
    status,
    notes
  )
  values (
    new_provider_id,
    auth.uid(),
    new_start_time,
    new_end_time,
    'confirmed', -- Auto-confirm on reschedule? Or pending? Let's say confirmed for Swap Mode efficiency.
    new_notes
  )
  returning id into new_appointment_id;

  return json_build_object(
    'old_appointment_id', old_appointment_id,
    'new_appointment_id', new_appointment_id,
    'status', 'success'
  );
end;
$$;
