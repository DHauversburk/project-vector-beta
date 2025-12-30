-- RPC: Generate Slots (The Cookie Cutter)
-- Efficiently creates empty slots for a date range, respecting days of week and avoiding duplicates.

CREATE OR REPLACE FUNCTION generate_slots(
  p_start_date date,
  p_end_date date,
  p_start_time time,
  p_end_time time,
  p_duration_minutes int,
  p_days_of_week int[] -- 0=Sun, 1=Mon, ..., 6=Sat
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_day date;
  current_slot_start timestamp;
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
    -- (EXTRACT(DOW FROM ...) returns 0-6)
    IF EXTRACT(DOW FROM current_day) = ANY(p_days_of_week) THEN
      
      -- 3. Loop through times for this day
      current_slot_start := current_day + p_start_time;
      
      -- While slot start < end time (for that day)
      WHILE current_slot_start::time < p_end_time LOOP
        
        -- 4. Attempt Insert (Collision Detection via WHERE NOT EXISTS)
        -- We want to avoid overlapping slots for this provider.
        -- A simple check: Is there any slot that OVERLAPS this 30m window?
        -- For simplicity in this v1, we just check exact start time match or simple overlap.
        
        IF NOT EXISTS (
          SELECT 1 FROM appointments 
          WHERE provider_id = provider_uuid
          AND start_time = current_slot_start
          -- Ideally, check range overlap: (StartA < EndB) and (EndA > StartB)
        ) THEN
          
          INSERT INTO appointments (
            provider_id,
            start_time,
            end_time,
            status,
            is_booked,
            member_id -- Explicitly NULL for open slots
          ) VALUES (
            provider_uuid,
            current_slot_start,
            current_slot_start + (p_duration_minutes || ' minutes')::interval,
            'pending', -- 'pending' is fine for open slots, or maybe we need 'open'? Schema has ('pending', 'confirmed'...)
            false,
            NULL
          );
          
          slots_created := slots_created + 1;
        END IF;

        -- Advance time
        current_slot_start := current_slot_start + (p_duration_minutes || ' minutes')::interval;
        
      END LOOP;
      
    END IF;

    -- Advance day
    current_day := current_day + 1;
  END LOOP;

  RETURN slots_created;
END;
$$;
