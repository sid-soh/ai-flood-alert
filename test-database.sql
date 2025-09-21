-- Test queries for distress calls table

-- 1. Insert test distress calls
INSERT INTO distress_calls (latitude, longitude, user_message) VALUES
(5.9804, 116.0735, 'Trapped in flooded area near Kota Kinabalu'),
(5.3307, 115.2307, 'Need evacuation assistance in Sandakan'),
(4.2105, 117.8794, 'Water rising fast, need immediate help');

-- 2. Query all distress calls
SELECT * FROM distress_calls ORDER BY call_time DESC;

-- 3. Query pending distress calls only
SELECT call_id, latitude, longitude, user_message, call_time 
FROM distress_calls 
WHERE rescue_status = 'PENDING' 
ORDER BY call_time DESC;

-- 4. Update rescue status (simulate rescue)
UPDATE distress_calls 
SET rescue_status = 'RESCUED', rescued_at = NOW() 
WHERE call_id = 1;

-- 5. Verify the update
SELECT * FROM distress_calls WHERE call_id = 1;

-- 6. Count calls by status
SELECT rescue_status, COUNT(*) as count 
FROM distress_calls 
GROUP BY rescue_status;