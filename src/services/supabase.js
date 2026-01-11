import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfnjvmnhxikbmdrvawef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbmp2bW5oeGlrYm1kcnZhd2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODc5ODMsImV4cCI6MjA4MzY2Mzk4M30.AvVwubZo-t5q-kXF5RyvJqe5ZL-VZQGAcSQ32Y7Cl90';

export const supabase = createClient(supabaseUrl, supabaseKey);