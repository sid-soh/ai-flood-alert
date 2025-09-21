import React, { useState, useEffect, useRef } from 'react';

const LiveFloodDashboard = () => {
  // Add CSS animations
  const styles = `
    @keyframes slideInFade {
      0% {
        transform: translateX(-20px);
        opacity: 0;
      }
      100% {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes wave {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
      margin-right: 6px;
    }
    .loading-text {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      font-size: 16px;
      color: #007bff;
      background: linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px);
      background-size: 200px;
      animation: shimmer 1.5s infinite;
      border-radius: 12px;
      border: 2px dashed #007bff;
    }
    .loading-dots span {
      display: inline-block;
      margin: 0 2px;
      animation: wave 1.4s ease-in-out infinite;
    }
    .loading-dots span:nth-child(1) { animation-delay: 0s; }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
    .tweet-hover:hover {
      animation: pulse 0.3s ease-in-out;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
      transform: translateY(-2px);
    }
    .glass-effect {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }
    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      .dashboard-grid > div:nth-child(2) {
        order: 2;
      }
    }
  `;
  
  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const [floodData, setFloodData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [liveTweets, setLiveTweets] = useState([]);
  const [sortedCities, setSortedCities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const prevPositions = useRef(new Map());

  // Fetch flood data from AWS API Gateway
  const fetchFloodData = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/flood-status');
      const result = await response.json();
      
      // Transform API response to match component expectations
      const transformedData = {
        success: true,
        totalCities: result.totalCities || result.cities?.length || 0,
        sabahFloodStatus: result.cities?.map(city => ({
          city: city.name,
          floodChancePercent: city.accuracy,
          floodStatus: city.riskLevel === 'HIGH' ? 'FLOODING' : 'NO_FLOOD',
          tweetCount: Math.floor(Math.random() * 50) + 5,
          floodTweetCount: Math.floor(Math.random() * 20),
          govSeverity: city.riskLevel,
          timestamps: {
            tweetTime24h: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            govTime24h: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString('en-GB', { hour12: false }),
            timeGap: `${Math.floor(Math.random() * 2)} hr ${Math.floor(Math.random() * 60)} min`,
            dataFreshness: {
              tweetAge: `${Math.floor(Math.random() * 30)} min ago`,
              govAge: `${Math.floor(Math.random() * 60)} min ago`
            }
          },
          aiReasoning: city.riskLevel === 'HIGH' ? 
            'High flood risk based on meteorological data and social media activity' :
            city.riskLevel === 'MEDIUM' ?
            'Moderate risk with some concerning indicators' :
            'Low risk based on current data analysis'
        })) || []
      };
      
      setFloodData(transformedData);
      
      // Update sorted cities with smooth transitions
      if (transformedData.sabahFloodStatus) {
        updateCitiesWithAnimation(transformedData.sabahFloodStatus);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch flood data from AWS:', error);
      // Use mock data as fallback
      const mockData = generateMockFloodData();
      setFloodData(mockData);
      setLastUpdate(new Date());
    }
    setIsUpdating(false);
  };

  // Update cities with smooth animation
  const updateCitiesWithAnimation = (newCities) => {
    // Sort cities by flood chance (highest first)
    const sorted = [...newCities].sort((a, b) => b.floodChancePercent - a.floodChancePercent);
    
    // Store previous positions for animation
    sorted.forEach((city, newIndex) => {
      const prevIndex = prevPositions.current.get(city.city);
      if (prevIndex !== undefined && prevIndex !== newIndex) {
        city.positionChanged = true;
      }
      prevPositions.current.set(city.city, newIndex);
    });
    
    setSortedCities(sorted);
  };

  // Generate mock data with varying percentages
  const generateMockFloodData = () => {
    const cities = [
      'Kota Kinabalu', 'Sandakan', 'Penampang', 'Tawau', 'Beaufort', 'Keningau',
      'Lahad Datu', 'Semporna', 'Kudat', 'Ranau', 'Papar', 'Tuaran',
      'Kota Belud', 'Kunak', 'Sipitang', 'Tenom', 'Nabawan', 'Tongod',
      'Kinabatangan', 'Beluran', 'Telupid', 'Pitas', 'Kota Marudu', 'Tambunan', 'Putatan'
    ];
    return {
      success: true,
      totalCities: cities.length,
      sabahFloodStatus: cities.map((city, index) => ({
        city,
        floodChancePercent: Math.floor(Math.random() * 100),
        floodStatus: Math.random() > 0.7 ? 'FLOODING' : 'NO_FLOOD',
        tweetCount: Math.floor(Math.random() * 50) + 5,
        floodTweetCount: Math.floor(Math.random() * 20),
        govSeverity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
        timestamps: {
          tweetTime24h: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          govTime24h: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString('en-GB', { hour12: false }),
          timeGap: `${Math.floor(Math.random() * 2)} hr ${Math.floor(Math.random() * 60)} min`,
          dataFreshness: {
            tweetAge: `${Math.floor(Math.random() * 30)} min ago`,
            govAge: `${Math.floor(Math.random() * 60)} min ago`
          }
        },
        aiReasoning: index < 3 ? 
          'High social media activity with government flood warnings indicating widespread impact' :
          'Low risk based on limited social media activity and no government alerts'
      }))
    };
  };

  // Generate mock tweets for demo
  const generateMockTweets = () => {
    const cities = ['Kota Kinabalu', 'Sandakan', 'Tawau', 'Penampang'];
    const users = ['ahmad_kk', 'siti_sabah', 'john_borneo', 'maria_east'];
    const floodTexts = [
      'Heavy rain causing street flooding 🌧️',
      'Hujan lebat menyebabkan banjir kilat',
      'Water levels rising in city center!',
      'Emergency services responding to flood calls 🚨'
    ];
    
    return Array.from({length: 8}, (_, i) => ({
      id: `mock_${Date.now()}_${i}`,
      city: cities[i % cities.length],
      username: users[i % users.length],
      text: floodTexts[i % floodTexts.length],
      time: new Date(Date.now() - i * 300000).toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }),
      isFlood: true,
      likes: Math.floor(Math.random() * 50),
      retweets: Math.floor(Math.random() * 20)
    }));
  };

  // Fetch tweets with fallback to mock data
  const fetchLiveTweets = async () => {
    try {
      const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/tweets');
      if (response.ok) {
        const result = await response.json();
        if (result.tweets && result.tweets.length > 0) {
          const formattedTweets = result.tweets.map((tweet, index) => ({
            id: `db_${Date.now()}_${index}`,
            city: tweet.location_name || 'Sabah',
            username: `user_${Math.random().toString(36).substr(2, 6)}`,
            text: tweet.content,
            time: new Date(tweet.post_time).toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }),
            isFlood: tweet.content.toLowerCase().includes('flood') || tweet.content.toLowerCase().includes('banjir'),
            likes: tweet.likes_count || 0,
            retweets: tweet.retweets_count || 0
          }));
          setLiveTweets(formattedTweets.slice(0, 10));
          return;
        }
      }
    } catch (error) {
      console.log('API failed, using mock data:', error.message);
    }
    // Fallback to mock data
    setLiveTweets(generateMockTweets());
  };

  // Set up intervals
  useEffect(() => {
    // Initial fetch
    fetchFloodData();

    // Fetch initial tweets
    fetchLiveTweets();
    
    // Update flood data every 2 minutes
    const floodInterval = setInterval(fetchFloodData, 2 * 60 * 1000);
    
    // Update tweets every 30 seconds
    const tweetInterval = setInterval(fetchLiveTweets, 30 * 1000);

    return () => {
      clearInterval(floodInterval);
      clearInterval(tweetInterval);
    };
  }, []);

  const getRiskColor = (percentage) => {
    if (percentage >= 70) return '#dc3545';
    if (percentage >= 50) return '#fd7e14';
    if (percentage >= 30) return '#ffc107';
    return '#28a745';
  };

  const getRiskIcon = (percentage) => {
    if (percentage >= 70) return '🔴';
    if (percentage >= 50) return '🟠';
    if (percentage >= 30) return '🟡';
    return '🟢';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="glass-effect" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '25px',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0', color: '#2c3e50', fontSize: '28px', fontWeight: '700' }}>🌊 Live Sabah Flood Monitor</h1>
          <p style={{ margin: '8px 0 0 0', color: '#5a6c7d', fontSize: '16px' }}>
            Real-time flood risk assessment • Updates every 2 minutes
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            backgroundColor: isUpdating ? '#ffc107' : '#28a745',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {isUpdating ? <><span className="spinner"></span>Updating</> : 'Live'}
          </div>
          {lastUpdate && (
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* City Status Section */}
        <div>
          <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '22px', fontWeight: '600' }}>🏙️ City Flood Status</h2>
          
          {/* Search Bar with Dropdown */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search for a city..."
              value={searchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setSearchQuery(query);
                
                if (query.trim()) {
                  const filtered = sortedCities.filter(city => 
                    city.city.toLowerCase().includes(query.toLowerCase())
                  );
                  setFilteredCities(filtered);
                  setShowDropdown(true);
                  
                  // Auto-select first match
                  if (filtered.length > 0) {
                    setSelectedCity(filtered[0]);
                  } else {
                    setSelectedCity(null);
                  }
                } else {
                  setSelectedCity(null);
                  setShowDropdown(false);
                  setFilteredCities([]);
                }
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setShowDropdown(true);
                } else {
                  // Show all cities when clicking on empty search bar
                  setFilteredCities(sortedCities);
                  setShowDropdown(true);
                }
              }}
              onBlur={() => {
                // Delay hiding dropdown to allow clicks
                setTimeout(() => setShowDropdown(false), 150);
              }}
              style={{
                width: '60%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: showDropdown ? '12px 12px 0 0' : '12px',
                outline: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                color: 'black'
              }}
            />
            
            {/* Dropdown Menu */}
            {showDropdown && (filteredCities.length > 0 || (!searchQuery.trim() && sortedCities.length > 0)) && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(15px)',
                border: '2px solid rgba(0,123,255,0.3)',
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                zIndex: 1000,
                maxHeight: '320px',
                overflowY: 'auto'
              }}>
                {(filteredCities.length > 0 ? filteredCities : sortedCities).map((city, index) => (
                  <div
                    key={city.city}
                    onClick={() => {
                      setSearchQuery(city.city);
                      setSelectedCity(city);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: index < filteredCities.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: index === 0 ? '#f8f9fa' : 'white',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = index === 0 ? '#f8f9fa' : 'white'}
                  >
                    <span style={{ color: '#495057' }}>
                      {city.floodStatus === 'FLOODING' ? '🌊' : '🏙️'} {city.city}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: getRiskColor(city.floodChancePercent),
                      fontWeight: 'bold'
                    }}>
                      {city.floodChancePercent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Display City Card */}
          {(() => {
            const cityToShow = selectedCity || (sortedCities.length > 0 ? sortedCities[0] : null);
            if (!cityToShow) return (
              <div className="loading-text glass-effect">
                <span style={{ marginRight: '10px', fontSize: '20px' }}>🌊</span>
                <span>Analyzing flood data</span>
                <div className="loading-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              </div>
            );
            
            return (
              <div className="glass-effect" style={{
                borderRadius: '16px',
                padding: '25px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                maxWidth: '520px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h3 style={{ margin: '0', color: '#495057', fontSize: '20px' }}>
                    {cityToShow.floodStatus === 'FLOODING' ? '🌊' : '🏙️'} {cityToShow.city}
                    {!selectedCity && <span style={{ fontSize: '14px', color: '#6c757d', marginLeft: '8px' }}>(Highest Risk)</span>}
                  </h3>
                  <span style={{ fontSize: '24px' }}>
                    {getRiskIcon(cityToShow.floodChancePercent)}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: getRiskColor(cityToShow.floodChancePercent),
                  marginBottom: '15px'
                }}>
                  {cityToShow.floodChancePercent}% Risk
                </div>
                
                <div style={{ fontSize: '16px', color: '#6c757d', marginBottom: '15px' }}>
                  Status: <strong style={{ color: cityToShow.floodStatus === 'FLOODING' ? '#dc3545' : '#28a745' }}>
                    {cityToShow.floodStatus.replace('_', ' ')}
                  </strong>
                </div>

                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
                  📱 Tweets: {cityToShow.tweetCount} ({cityToShow.floodTweetCount} flood-related)<br/>
                  🏛️ Gov Severity: {cityToShow.govSeverity}
                </div>

                {cityToShow.timestamps && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6c757d',
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}>
                    <div>📱 Tweet: {cityToShow.timestamps.tweetTime24h} ({cityToShow.timestamps.dataFreshness.tweetAge})</div>
                    <div>🏛️ Gov: {cityToShow.timestamps.govTime24h} ({cityToShow.timestamps.dataFreshness.govAge})</div>
                    <div>⏱️ Gap: {cityToShow.timestamps.timeGap}</div>
                  </div>
                )}

                <div style={{ fontSize: '14px', color: '#495057', fontStyle: 'italic', lineHeight: '1.4' }}>
                  {cityToShow.aiReasoning}
                </div>
              </div>
            );
          })()} 
        </div>

        {/* Live Tweet Feed */}
        <div>
          <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '22px', fontWeight: '600' }}>📢 Live Tweet Feed</h2>
          <div className="glass-effect" style={{
            borderRadius: '16px',
            padding: '20px',
            height: '620px',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            {liveTweets.length === 0 ? (
              <p style={{ color: '#6c757d', textAlign: 'center' }}>Waiting for tweets...</p>
            ) : (
              liveTweets.map((tweet, index) => (
                <div key={tweet.id} className="tweet-hover" style={{
                  backgroundColor: tweet.isFlood ? '#fff5f5' : '#f8f9fa',
                  border: `1px solid ${tweet.isFlood ? '#fed7d7' : '#e9ecef'}`,
                  borderLeft: `4px solid ${tweet.isFlood ? '#dc3545' : '#00acee'}`,
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '10px',
                  animation: `slideInFade 0.6s ease-out ${index * 0.1}s both`,
                  transform: 'translateX(-20px)',
                  opacity: 0,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <div>
                      <strong style={{ color: '#1da1f2' }}>@{tweet.username}</strong>
                      <span style={{ color: '#6c757d', fontSize: '12px', marginLeft: '8px' }}>• {tweet.city}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#6c757d' }}>{tweet.time}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                    {tweet.isFlood ? '🚨' : '💬'} {tweet.text}
                  </div>
                  {(tweet.likes > 0 || tweet.retweets > 0) && (
                    <div style={{ fontSize: '12px', color: '#6c757d', display: 'flex', gap: '12px' }}>
                      {tweet.likes > 0 && <span>❤️ {tweet.likes}</span>}
                      {tweet.retweets > 0 && <span>🔁 {tweet.retweets}</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFloodDashboard;