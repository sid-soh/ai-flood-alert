-- Combined schema deployment for AWS RDS
-- Run this script on your RDS MySQL instance

-- Create main flood alert tables
CREATE TABLE IF NOT EXISTS flood_alerts (
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

CREATE TABLE IF NOT EXISTS evacuation_points (
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

-- News dashboard tables
CREATE TABLE IF NOT EXISTS location (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(50) DEFAULT 'CITY',
    state VARCHAR(50) NOT NULL DEFAULT 'SABAH',
    coordinates POINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    base_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS x_post (
    x_post_id INT AUTO_INCREMENT PRIMARY KEY,
    source_id INT NOT NULL,
    location_id INT,
    original_id VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    post_time DATETIME NOT NULL,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    url VARCHAR(500),
    sentiment_score DECIMAL(3,2),
    credibility_score INT,
    likes_count INT DEFAULT 0,
    retweets_count INT DEFAULT 0,
    replies_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(source_id),
    CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES location(location_id) ON DELETE SET NULL,
    CHECK (credibility_score >= 0 AND credibility_score <= 100)
);

-- Sample data
INSERT IGNORE INTO evacuation_points (name, latitude, longitude, capacity, type, contact_info) VALUES
('Sabah State Library', 5.9788, 116.0753, 500, 'SHELTER', '+60-88-212345'),
('Universiti Malaysia Sabah', 6.0367, 116.1186, 1000, 'SCHOOL', '+60-88-320000'),
('Likas Sports Complex', 5.9897, 116.0736, 800, 'COMMUNITY_CENTER', '+60-88-234567'),
('Queen Elizabeth Hospital', 5.9731, 116.0678, 200, 'HOSPITAL', '+60-88-324600'),
('Penampang Community Hall', 5.9370, 116.1063, 300, 'ASSEMBLY_POINT', '+60-88-712345');

INSERT IGNORE INTO flood_alerts (location_name, latitude, longitude, severity, alert_type, description) VALUES
('Kota Kinabalu City Center', 5.9804, 116.0735, 'HIGH', 'FLASH_FLOOD', 'Heavy rainfall causing flash floods in city center'),
('Penampang District', 5.9370, 116.1063, 'MEDIUM', 'RIVER_FLOOD', 'River levels rising due to continuous rain'),
('Putatan Area', 5.9667, 116.0833, 'LOW', 'URBAN_FLOOD', 'Minor flooding in low-lying areas');