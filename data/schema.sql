-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS assessment;
DROP TABLE IF EXISTS postkeyword;
DROP TABLE IF EXISTS x_post;
DROP TABLE IF EXISTS official_announcement;
DROP TABLE IF EXISTS meteorological_alert;
DROP TABLE IF EXISTS source;
DROP TABLE IF EXISTS location;
DROP TABLE IF EXISTS keyword;

-- Create base tables first (no dependencies) ---
-- Keywords table
CREATE TABLE keyword (
    keyword_id INT AUTO_INCREMENT PRIMARY KEY,
    keyword_text VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE location (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(50) DEFAULT 'CITY',
    state VARCHAR(50) NOT NULL DEFAULT 'SABAH',
    coordinates POINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sources table
CREATE TABLE source (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    base_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create dependent tables ---
-- Social posts table
CREATE TABLE x_post (
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

-- Meteorological alerts table with unique constraint
CREATE TABLE meteorological_alert (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT,
    alert_type VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    description TEXT,
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    source_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES location(location_id),
    UNIQUE KEY unique_location_date (location_id, issued_at)
);

-- Official announcements table
CREATE TABLE official_announcement (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    source_id INT,
    location_id INT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20),
    published_at TIMESTAMP NOT NULL,
    announcement_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES source(source_id),
    FOREIGN KEY (location_id) REFERENCES location(location_id)
);

-- Junction table for post-keyword relationships
CREATE TABLE postkeyword (
    x_post_id INT,
    keyword_id INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (x_post_id, keyword_id),
    FOREIGN KEY (x_post_id) REFERENCES x_post(x_post_id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES keyword(keyword_id) ON DELETE CASCADE
);

-- Assessment table
CREATE TABLE assessment (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_post_id INT,
    met_alert_id INT,
    official_announcement_id INT,
    assessment_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),
    notes TEXT,
    FOREIGN KEY (x_post_id) REFERENCES x_post(x_post_id),
    FOREIGN KEY (met_alert_id) REFERENCES meteorological_alert(alert_id),
    FOREIGN KEY (official_announcement_id) REFERENCES official_announcement(announcement_id)
);

-- Create indexes for better performance
CREATE INDEX idx_keyword_category ON keyword(category);
CREATE INDEX idx_keyword_text ON keyword(keyword_text);

CREATE INDEX idx_location_name ON location(name);
CREATE INDEX idx_location_type ON location(location_type);

CREATE INDEX idx_source_type ON source(type);
CREATE INDEX idx_source_active ON source(is_active);

CREATE INDEX idx_x_post_post_time ON x_post(post_time);
CREATE INDEX idx_x_post_location ON x_post(location_id);
CREATE INDEX idx_x_post_scraped_at ON x_post(scraped_at);
CREATE INDEX idx_x_post_original_id ON x_post(original_id);

CREATE INDEX idx_met_alert_issued_at ON meteorological_alert(issued_at);
CREATE INDEX idx_met_alert_status ON meteorological_alert(status);
CREATE INDEX idx_met_alert_severity ON meteorological_alert(severity_level);

CREATE INDEX idx_official_announcement_published_at ON official_announcement(published_at);
CREATE INDEX idx_official_announcement_active ON official_announcement(is_active);
CREATE INDEX idx_official_announcement_type ON official_announcement(announcement_type);

CREATE INDEX idx_assessment_status ON assessment(status);
CREATE INDEX idx_assessment_type ON assessment(assessment_type);
CREATE INDEX idx_assessment_created_at ON assessment(created_at);