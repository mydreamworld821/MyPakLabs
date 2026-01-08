-- First migration: Add lab_admin to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lab_admin';