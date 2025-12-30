-- RPC: Generate Slots (Fixed for Single Block)
-- Updates the generate_slots function to create a SINGLE continuous block when p_is_block is TRUE,
-- rather than fragmenting it into duration-sized chunks.

CREATE OR REPLACE FUNCTION generate_slots(
  p_start_date date,
  p_end_date date,
  p_start_time time,
  p_end_time time,
  p_duration_minutes int,
  p_break_minutes int,
  p_days_of_week int[],
  p_is_block boolean DEFAULT false,
  p_notes text DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_day date;
  current_slot_start timestamp;
  current_slot_end timestamp;
  slots_created int := 0;
  provider_uuid uuid;
BEGIN
  -- 1. Get the Provider ID (must be the caller)
  provider_uuid := auth.uid();
  IF provider_uuid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Loop through dates
  current_day := p_start_date;
  WHILE current_day <= p_end_date LOOP
    
    -- Check if this day is in the allowed days_of_week
    IF EXTRACT(DOW FROM current_day) = ANY(p_days_of_week) THEN
      
      IF p_is_block THEN
          -- [NEW LOGIC] SINGLE BLOCK MODE
          -- Create one single slot spanning the entire requested time range for this day
          current_slot_start := current_day + p_start_time;
          current_slot_end := current_day + p_end_time;
          
          -- Validate valid time range
          IF current_slot_end > current_slot_start THEN
               INSERT INTO appointments (
                  provider_id,
                  start_time,
                  end_time,
                  status,
                  is_booked,
                  member_id,
                  notes
                ) VALUES (
                  provider_uuid,
                  current_slot_start,
                  current_slot_end,
                  'blocked',
                  true,
                  NULL,
                  COALESCE(p_notes, 'SYSTEM BLOCK')
                )
                ON CONFLICT (provider_id, start_time) 
                DO UPDATE SET 
                  is_booked = EXCLUDED.is_booked,
                  status = EXCLUDED.status,
                  notes = EXCLUDED.notes
                WHERE appointments.member_id IS NULL; -- Don't overwrite actual bookings
                
                slots_created := slots_created + 1;
          END IF;

      ELSE
          -- [EXISTING LOGIC] STANDARD LOOPS (15/30/60 min slots)
          current_slot_start := current_day + p_start_time;
          
          -- While slot start < end time (for that day)
          WHILE current_slot_start::time < p_end_time LOOP
            
            current_slot_end := current_slot_start + (p_duration_minutes || ' minutes')::interval;

            -- Ensure the slot fits entirely before the end time
            IF current_slot_end::time <= p_end_time THEN

                -- 4. Attempt Insert (Collision Detection via WHERE NOT EXISTS)
                INSERT INTO appointments (
                  provider_id,
                  start_time,
                  end_time,
                  status,
                  is_booked,
                  member_id,
                  notes
                ) VALUES (
                  provider_uuid,
                  current_slot_start,
                  current_slot_end,
                  'pending',
                  false,
                  NULL,
                  p_notes
                )
                ON CONFLICT (provider_id, start_time) 
                DO UPDATE SET 
                  is_booked = EXCLUDED.is_booked,
                  status = EXCLUDED.status,
                  notes = EXCLUDED.notes
                WHERE appointments.member_id IS NULL; -- Don't overwrite actual bookings
                
                slots_created := slots_created + 1;

            END IF;

            -- Advance time: Duration + Break
            current_slot_start := current_slot_end + (p_break_minutes || ' minutes')::interval;
            
          END LOOP;
      END IF; -- End Block vs Standard check
      
    END IF;

    -- Advance day
    current_day := current_day + 1;
  END LOOP;

  RETURN slots_created;
END;
$$;
