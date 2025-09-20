-- Database schema for AI Flood Alert System

CREATE DATABASE IF NOT EXISTS flood_alert_db;
USE flood_alert_db;

-- Flood alerts table
CREATE TABLE flood_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    alert_type ENUM('FLASH_FLOOD', 'RIVER_FLOOD', 'COASTAL_FLOOD', 'URBAN_FLOOD') NOT NULL,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (latitude, longitude),
    INDEX idx_active_severity (active, severity),
    INDEX idx_timestamp (timestamp)
);

-- Evacuation points table
CREATE TABLE evacuation_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    capacity INT DEFAULT 0,
    type ENUM('SHELTER', 'ASSEMBLY_POINT', 'SCHOOL', 'COMMUNITY_CENTER', 'HOSPITAL') NOT NULL,
    contact_info VARCHAR(255),
    facilities TEXT,
    accessibility BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_location (latitude, longitude),
    INDEX idx_type (type)
);

-- User locations for analytics
CREATE TABLE user_locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    INDEX idx_timestamp (timestamp),
    INDEX idx_location (latitude, longitude)
);

-- Sample data for testing
INSERT INTO flood_alerts (location_name, latitude, longitude, severity, alert_type, description) VALUES
('Kota Kinabalu City Center', 5.9804, 116.0735, 'HIGH', 'FLASH_FLOOD', 'Heavy rainfall causing flash floods in city center'),
('Penampang District', 5.9370, 116.1063, 'MEDIUM', 'RIVER_FLOOD', 'River levels rising due to continuous rain'),
('Putatan Area', 5.9667, 116.0833, 'LOW', 'URBAN_FLOOD', 'Minor flooding in low-lying areas');

INSERT INTO evacuation_points (name, latitude, longitude, capacity, type, contact_info) VALUES
('Sabah State Library', 5.9788, 116.0753, 500, 'SHELTER', '+60-88-212345'),
('Universiti Malaysia Sabah', 6.0367, 116.1186, 1000, 'SCHOOL', '+60-88-320000'),
('Likas Sports Complex', 5.9897, 116.0736, 800, 'COMMUNITY_CENTER', '+60-88-234567'),
('Queen Elizabeth Hospital', 5.9731, 116.0678, 200, 'HOSPITAL', '+60-88-324600'),
('Penampang Community Hall', 5.9370, 116.1063, 300, 'ASSEMBLY_POINT', '+60-88-712345');