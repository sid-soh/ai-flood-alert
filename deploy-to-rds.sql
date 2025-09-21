-- Flood Alert System Database Schema
-- Deploy this to your RDS MySQL instance

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS flood_alert_system;
USE flood_alert_system;

-- Evacuation points table
CREATE TABLE IF NOT EXISTS evacuation_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    capacity INT DEFAULT 0,
    facilities TEXT,
    contact_info VARCHAR(255),
    status ENUM('active', 'inactive', 'full') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Flood alerts table
CREATE TABLE IF NOT EXISTS flood_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    message TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Flood status table for Sabah monitoring
CREATE TABLE IF NOT EXISTS flood_status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    city VARCHAR(100) NOT NULL,
    flood_chance_percent INT NOT NULL,
    flood_status ENUM('NO_FLOOD', 'FLOODING', 'HIGH_RISK') NOT NULL,
    tweet_count INT DEFAULT 0,
    flood_tweet_count INT DEFAULT 0,
    gov_severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
    ai_reasoning TEXT,
    tweet_timestamp DATETIME,
    gov_timestamp DATETIME,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_city (city)
);

-- Distress calls table
CREATE TABLE IF NOT EXISTS distress_calls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    message TEXT,
    status ENUM('pending', 'responded', 'resolved') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    responder_id VARCHAR(100) NULL
);

-- Insert sample evacuation points for Sabah
INSERT INTO evacuation_points (name, latitude, longitude, capacity, facilities) VALUES
('Kota Kinabalu Community Center', 5.9804, 116.0735, 500, 'Medical aid, Food, Water, Shelter'),
('Penampang District Hall', 5.9370, 116.1063, 300, 'Shelter, Basic supplies'),
('Sandakan Emergency Center', 6.1248, 118.0648, 400, 'Medical aid, Communication center'),
('Tawau Relief Center', 4.2767, 117.8814, 350, 'Food, Water, Temporary housing'),
('Beaufort Community Hall', 5.3471, 115.7447, 200, 'Basic shelter, First aid');

-- Insert sample flood status data for Sabah cities
INSERT INTO flood_status (city, flood_chance_percent, flood_status, tweet_count, flood_tweet_count, gov_severity, ai_reasoning, tweet_timestamp, gov_timestamp) VALUES
('Kota Kinabalu', 75, 'HIGH_RISK', 45, 28, 'HIGH', 'High social media activity with government flood warnings indicating widespread impact', NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 1 HOUR),
('Sandakan', 60, 'FLOODING', 32, 18, 'MEDIUM', 'Moderate flood reports with some government alerts', NOW() - INTERVAL 45 MINUTE, NOW() - INTERVAL 2 HOUR),
('Penampang', 85, 'FLOODING', 52, 35, 'CRITICAL', 'Critical flood situation with emergency response activated', NOW() - INTERVAL 15 MINUTE, NOW() - INTERVAL 30 MINUTE),
('Tawau', 40, 'NO_FLOOD', 15, 5, 'LOW', 'Low risk based on limited social media activity and no government alerts', NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 3 HOUR),
('Beaufort', 55, 'HIGH_RISK', 28, 12, 'MEDIUM', 'Moderate risk with increasing social media reports', NOW() - INTERVAL 20 MINUTE, NOW() - INTERVAL 1 HOUR);

-- Insert sample flood alerts
INSERT INTO flood_alerts (location, latitude, longitude, severity, message, expires_at) VALUES
('Kota Kinabalu City Center', 5.9804, 116.0735, 'high', 'Flash flood warning in effect. Avoid downtown area.', NOW() + INTERVAL 6 HOUR),
('Penampang District', 5.9370, 116.1063, 'critical', 'Severe flooding reported. Evacuation recommended for low-lying areas.', NOW() + INTERVAL 12 HOUR),
('Sandakan Waterfront', 6.1248, 118.0648, 'medium', 'Rising water levels detected. Monitor conditions closely.', NOW() + INTERVAL 4 HOUR);

-- Create indexes for better performance
CREATE INDEX idx_evacuation_location ON evacuation_points(latitude, longitude);
CREATE INDEX idx_flood_alerts_active ON flood_alerts(active, timestamp);
CREATE INDEX idx_flood_status_city ON flood_status(city);
CREATE INDEX idx_distress_calls_status ON distress_calls(status, timestamp);

-- Create views for common queries
CREATE VIEW active_flood_alerts AS
SELECT * FROM flood_alerts 
WHERE active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY severity DESC, timestamp DESC;

CREATE VIEW current_flood_status AS
SELECT 
    city,
    flood_chance_percent,
    flood_status,
    gov_severity,
    TIMESTAMPDIFF(MINUTE, tweet_timestamp, NOW()) as tweet_age_minutes,
    TIMESTAMPDIFF(MINUTE, gov_timestamp, NOW()) as gov_age_minutes,
    updated_at
FROM flood_status
ORDER BY flood_chance_percent DESC;

COMMIT;