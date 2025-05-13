/*
  # Create bookings table and functions for 1-on-1 calls
  
  1. New Tables
     - `bookings` - Store calendar bookings for 1-on-1 calls
  
  2. Functions
     - `check_time_slot_availability` - Checks if a time slot is available
     - `create_booking` - Creates a new booking
     - `get_available_slots` - Gets all available slots for a product on a specific date
     
  3. Security
     - Enable RLS on bookings table
     - Add policies for customers and creators to view and manage their bookings
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on the bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
CREATE POLICY "Creators can view bookings for their products"
  ON public.bookings FOR SELECT
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Customers can view their own bookings"
  ON public.bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Creators can update booking status"
  ON public.bookings FOR UPDATE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ))
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

-- Fixed policy to allow customers to cancel their own bookings
-- Avoiding reference to OLD table which causes the error
CREATE POLICY "Customers can cancel their own bookings"
  ON public.bookings FOR UPDATE
  USING (
    customer_id = auth.uid() AND
    status IN ('pending', 'confirmed')
  )
  WITH CHECK (
    customer_id = auth.uid() AND
    status = 'cancelled'
  );

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION public.check_time_slot_availability(
  p_product_id UUID,
  p_booking_date DATE,
  p_start_time TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_is_available BOOLEAN;
  v_creator_id UUID;
  v_is_valid_slot BOOLEAN;
BEGIN
  -- Get the creator_id for this product
  SELECT creator_id INTO v_creator_id
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if this is a valid time slot for the product
  SELECT EXISTS (
    SELECT 1 FROM products
    WHERE id = p_product_id
      AND p_start_time = ANY(call_time_slots)
      AND EXTRACT(DOW FROM p_booking_date) = ANY(
        ARRAY(
          SELECT CASE 
            WHEN day = 'Monday' THEN 1
            WHEN day = 'Tuesday' THEN 2
            WHEN day = 'Wednesday' THEN 3
            WHEN day = 'Thursday' THEN 4
            WHEN day = 'Friday' THEN 5
            WHEN day = 'Saturday' THEN 6
            WHEN day = 'Sunday' THEN 0
          END
          FROM unnest(available_days) AS day
        )::integer[]
      )
  ) INTO v_is_valid_slot;
  
  IF NOT v_is_valid_slot THEN
    RETURN FALSE;
  END IF;
  
  -- Check if this slot is already booked (not cancelled)
  SELECT NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE product_id = p_product_id
      AND booking_date = p_booking_date
      AND start_time = p_start_time
      AND status != 'cancelled'
  ) INTO v_is_available;
  
  -- Also check if the creator has other bookings at this time
  IF v_is_available THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE creator_id = v_creator_id
        AND booking_date = p_booking_date
        AND start_time = p_start_time
        AND status != 'cancelled'
    ) INTO v_is_available;
  END IF;
  
  RETURN v_is_available;
END;
$$;

-- Function to get available time slots for a product on a specific date
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_product_id UUID,
  p_date DATE
)
RETURNS TABLE (
  start_time TEXT,
  end_time TEXT,
  is_available BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_product products%ROWTYPE;
  v_time_slot TEXT;
  v_end_time TEXT;
  v_duration INTEGER;
BEGIN
  -- Get the product details
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check if the selected date is an available day
  IF NOT EXTRACT(DOW FROM p_date) = ANY(
    ARRAY(
      SELECT CASE 
        WHEN day = 'Monday' THEN 1
        WHEN day = 'Tuesday' THEN 2
        WHEN day = 'Wednesday' THEN 3
        WHEN day = 'Thursday' THEN 4
        WHEN day = 'Friday' THEN 5
        WHEN day = 'Saturday' THEN 6
        WHEN day = 'Sunday' THEN 0
      END
      FROM unnest(v_product.available_days) AS day
    )::integer[]
  ) THEN
    RETURN;
  END IF;
  
  -- Get the call duration
  v_duration := COALESCE(v_product.call_duration, 30);
  
  -- Loop through each time slot and check availability
  FOR v_time_slot IN SELECT unnest(v_product.call_time_slots)
  LOOP
    -- Calculate end time by adding duration
    SELECT to_char(
      (to_timestamp(v_time_slot, 'HH24:MI') + (v_duration || ' minutes')::interval)::time, 
      'HH24:MI'
    ) INTO v_end_time;
    
    -- Return the slot with availability info
    start_time := v_time_slot;
    end_time := v_end_time;
    is_available := public.check_time_slot_availability(p_product_id, p_date, v_time_slot);
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- Function to create a booking
CREATE OR REPLACE FUNCTION public.create_booking(
  p_product_id UUID,
  p_booking_date DATE,
  p_start_time TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_creator_id UUID;
  v_product products%ROWTYPE;
  v_end_time TEXT;
  v_booking_id UUID;
  v_is_available BOOLEAN;
BEGIN
  -- Check if the user is authenticated
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get product details
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  v_creator_id := v_product.creator_id;
  
  -- Check if the time slot is available
  SELECT public.check_time_slot_availability(p_product_id, p_booking_date, p_start_time)
  INTO v_is_available;
  
  IF NOT v_is_available THEN
    RAISE EXCEPTION 'This time slot is not available';
  END IF;
  
  -- Calculate end time
  SELECT to_char(
    (to_timestamp(p_start_time, 'HH24:MI') + (COALESCE(v_product.call_duration, 30) || ' minutes')::interval)::time, 
    'HH24:MI'
  ) INTO v_end_time;
  
  -- Create the booking
  INSERT INTO bookings (
    product_id,
    customer_id,
    creator_id,
    booking_date,
    start_time,
    end_time,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    p_product_id,
    v_customer_id,
    v_creator_id,
    p_booking_date,
    p_start_time,
    v_end_time,
    p_notes,
    now(),
    now()
  )
  RETURNING id INTO v_booking_id;
  
  RETURN v_booking_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_time_slot_availability(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, DATE, TEXT, TEXT) TO authenticated;