-- Invoice Billing System Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create the invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on client_name for faster searches
CREATE INDEX IF NOT EXISTS idx_invoices_client_name ON invoices(client_name);

-- Create an index on invoice_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- Create an index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- You can modify this based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON invoices
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a policy that allows read access for anonymous users (if needed)
-- Uncomment the line below if you want anonymous users to read invoices
-- CREATE POLICY "Allow read for anonymous users" ON invoices FOR SELECT USING (true);

-- Insert a sample invoice for testing (optional)
INSERT INTO invoices (client_name, invoice_date, items, subtotal, tax, grand_total) 
VALUES (
  'Sample Client',
  CURRENT_DATE,
  '[{"name": "Web Design", "quantity": 1, "price": 50000, "total": 50000}]'::jsonb,
  50000.00,
  9000.00,
  59000.00
) ON CONFLICT DO NOTHING;

-- Verify the table was created successfully
SELECT 'Table created successfully!' as message;
SELECT * FROM invoices LIMIT 5;
