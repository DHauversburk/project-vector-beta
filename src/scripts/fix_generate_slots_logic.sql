-- Drop function to ensure clean recreation
DROP FUNCTION IF EXISTS generate_slots(date, date, text, text, int, int, int[], boolean, text, int);
DROP FUNCTION IF EXISTS generate_slots(date, date, text, text, int, int, int[], boolean, text);

-- Recreate with Block Logic, UTC Conversion, and SMART OVERLAP HANDLING (No GOTO)
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
    slot_start timestamp; -- Local timestamp
    slot_end timestamp;
    day_end timestamp;
    utc_start timestamptz;
    utc_end timestamptz;
    slots_created int := 0;
    p_provider_id uuid;
    conflict_count int;
    has_conflict boolean;
BEGIN
    p_provider_id := auth.uid();
    
    FOR curr_date IN SELECT generate_series(p_start_date, p_end_date, '1 day') LOOP
        
        IF EXTRACT(DOW FROM curr_date) = ANY(p_days_of_week) THEN
            
            -- Construct Local Boundaries
            slot_start := (curr_date || ' ' || p_start_time)::timestamp;
            day_end := (curr_date || ' ' || p_end_time)::timestamp;
            
            WHILE slot_start < day_end LOOP
                
                IF p_is_block THEN
                    -- Block Logic: Create ONE slot spanning the entire requested time window
                    slot_end := day_end;
                ELSE
                    -- Standard Logic: Incremental slots
                    slot_end := slot_start + (p_duration_minutes || ' minutes')::interval;
                END IF;
                
                -- Verify we haven't exceeded bounds
                IF slot_end > day_end THEN
                    EXIT;
                END IF;
                
                -- UTC Conversion
                utc_start := (slot_start + (p_timezone_offset_minutes || ' minutes')::interval) AT TIME ZONE 'UTC';
                utc_end := (slot_end + (p_timezone_offset_minutes || ' minutes')::interval) AT TIME ZONE 'UTC';
                
                -- OVERLAP HANDLING
                has_conflict := FALSE;
                
                -- 1. Check for Patient Appointments (Protected)
                -- Any slot that has a real member_id assigned is untouchable.
                SELECT COUNT(*) INTO conflict_count
                FROM appointments
                WHERE provider_id = p_provider_id
                AND start_time < utc_end
                AND end_time > utc_start
                AND member_id IS NOT NULL;
                
                IF conflict_count > 0 THEN
                    has_conflict := TRUE;
                END IF;
                
                -- 2. Handle Empty/Pending/Block conflicts (If no patient conflict)
                IF NOT has_conflict THEN
                    IF p_is_block THEN
                        -- BLOCKING: Overrides/Deletes any existing open/blocked slots in the way
                        DELETE FROM appointments
                        WHERE provider_id = p_provider_id
                        AND start_time < utc_end
                        AND end_time > utc_start
                        AND member_id IS NULL; -- Only delete unbooked
                    ELSE
                        -- AVAILABLE: Be Polite. If anything exists (even another empty slot), Skip.
                        SELECT COUNT(*) INTO conflict_count
                        FROM appointments
                        WHERE provider_id = p_provider_id
                        AND start_time < utc_end
                        AND end_time > utc_start;
                        
                        IF conflict_count > 0 THEN
                            has_conflict := TRUE;
                        END IF;
                    END IF;
                END IF;

                -- Insert Appointment if no conflict
                IF NOT has_conflict THEN
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
                END IF;
                
                IF p_is_block THEN
                    EXIT; -- Stop after creating the single block
                END IF;
                
                -- Advance
                slot_start := slot_end + (p_break_minutes || ' minutes')::interval;
                
            END LOOP;
            
        END IF;
    END LOOP;
    
    RETURN slots_created;
END;
$$;
