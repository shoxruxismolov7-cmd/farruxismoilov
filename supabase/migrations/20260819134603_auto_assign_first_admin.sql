/*
# Auto-assign first user as admin

## Overview
Updates the `handle_new_user()` trigger function to automatically assign the 'super_admin' role to the very first user who signs up. All subsequent users get the 'student' role. This ensures the platform always has an initial admin without manual database intervention.

## Changes
1. Modified `handle_new_user()` function to check if any profiles exist before inserting. If none exist, the new user gets role='super_admin'. Otherwise, role='student'.
2. Also updates the `raw_app_meta_data` with the role so RLS policies via `is_admin()` work immediately.

## Security
- Only the FIRST ever user gets admin. All others are students.
- The role is written to both `profiles.role` and `auth.users.raw_app_meta_data` for RLS enforcement.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count int;
  assigned_role text;
BEGIN
  SELECT count(*) INTO user_count FROM public.profiles;
  IF user_count = 0 THEN
    assigned_role := 'super_admin';
  ELSE
    assigned_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), assigned_role);

  -- Update raw_app_meta_data so is_admin() RLS checks work
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', assigned_role)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;
