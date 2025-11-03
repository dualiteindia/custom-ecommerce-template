ALTER TABLE orders
ADD COLUMN shipping_address_id UUID REFERENCES shipping_addresses(id);

-- You might want to add a script here to migrate existing data from the old columns to the new table.
-- For now, we'll just drop the old columns.

ALTER TABLE orders
DROP COLUMN shipping_address;

ALTER TABLE orders
DROP COLUMN customer_name;
