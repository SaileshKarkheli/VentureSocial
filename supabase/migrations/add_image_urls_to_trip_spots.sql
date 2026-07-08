-- Migration: add image_urls array column to trip_spots
-- Run this once in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/dompjxmsdysrpicarxel/sql/new

ALTER TABLE trip_spots ADD COLUMN IF NOT EXISTS image_urls text[];
