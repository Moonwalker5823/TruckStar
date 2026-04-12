CREATE DATABASE IF NOT EXISTS food_trucks;
USE food_trucks;

CREATE TABLE IF NOT EXISTS trucks (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL UNIQUE,
  latitude     FLOAT        NOT NULL,
  longitude    FLOAT        NOT NULL,
  cuisine      VARCHAR(255),
  source       VARCHAR(100) DEFAULT 'google_places',
  last_seen_at DATETIME     NOT NULL
);
