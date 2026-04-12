CREATE DATABASE IF NOT EXISTS food_trucks;
USE food_trucks;

CREATE TABLE IF NOT EXISTS trucks (
  id              INT            AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255)   NOT NULL UNIQUE,
  latitude        DECIMAL(10, 7) NOT NULL,
  longitude       DECIMAL(10, 7) NOT NULL,
  cuisine         VARCHAR(255),
  website         VARCHAR(500),
  phone           VARCHAR(50),
  photo_reference VARCHAR(500),
  source          VARCHAR(100)   DEFAULT 'google_places',
  last_seen_at    DATETIME       NOT NULL
);

-- Add new columns to existing installs (safe to re-run)
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS website         VARCHAR(500);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS phone           VARCHAR(50);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS photo_reference VARCHAR(500);
