-- Drop the old function first to allow signature change
DROP FUNCTION IF EXISTS generate_slots(date, date, text, text, int, int, int[], boolean, text);

-- Recreate with Timezone Offset parameter
CREATE OR REPLACE FUNCTION generate_slots(
    p_start_date date,
    p_end_date date,
    p_start_time text,
    p_end_time text,
    p_duration_minutes int,
    p_break_minutes int,
    p_days_of_week int[],
    p_is_block boolean,
    p_notes text,
    p_timezone_offset_minutes int DEFAULT 0
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    curr_date date;
    slot_start timestamp; -- Local timestamp (abstract)
    slot_end timestamp;
    day_end timestamp;
    utc_start timestamptz;
    utc_end timestamptz;
    slots_created int := 0;
    p_provider_id uuid;
BEGIN
    p_provider_id := auth.uid();
    
    -- Iterate through each day in the range
    FOR curr_date IN SELECT generate_series(p_start_date, p_end_date, '1 day') LOOP
        
        -- Check if day of week matches (Postgres DOW: 0=Sun, 6=Sat)
        IF EXTRACT(DOW FROM curr_date) = ANY(p_days_of_week) THEN
            
            -- Construct Local Time Boundaries for this specific day
            -- Casting text to timestamp creates a "timestamp without time zone" (Local Time)
            slot_start := (curr_date || ' ' || p_start_time)::timestamp;
            day_end := (curr_date || ' ' || p_end_time)::timestamp;
            
            -- Generate Slots for the day
            WHILE slot_start < day_end LOOP
                
                -- Calculate Slot End (Local)
                slot_end := slot_start + (p_duration_minutes || ' minutes')::interval;
                
                -- Stop if slot exceeds day end
                IF slot_end > day_end THEN
                    EXIT;
                END IF;
                
                -- Conversion to UTC for Storage
                -- Logic: local_time + offset_minutes = utc_time
                -- (Example: 09:00 CST + 360min (6h) = 15:00 UTC)
                utc_start := slot_start + (p_timezone_offset_minutes || ' minutes')::interval;
                utc_end := slot_end + (p_timezone_offset_minutes || ' minutes')::interval;
                
                -- Insert Appointment
                INSERT INTO appointments (
                    provider_id,
                    start_time,
                    end_time,
                    status,
                    is_booked,
                    notes
                ) VALUES (
                    p_provider_id,
                    utc_start,
                    utc_end,
                    CASE WHEN p_is_block THEN 'blocked' ELSE 'pending' END,
                    p_is_block,
                    p_notes
                );
                
                slots_created := slots_created + 1;
                
                -- Advance to next slot (add break time)
                slot_start := slot_end + (p_break_minutes || ' minutes')::interval;
                
            END LOOP;
            
        END IF;
    END LOOP;
    
    RETURN slots_created;
END;
$$;
