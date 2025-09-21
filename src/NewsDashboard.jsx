import React, { useState, useEffect } from 'react';

const NewsDashboard = () => {
  const [focusLocation, setFocusLocation] = useState('Sabah Flood Crisis');
  const [twitterData, setTwitterData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [officialNews, setOfficialNews] = useState(null);
  const [liveTweets, setLiveTweets] = useState([]);
  const [currentTweetIndex, setCurrentTweetIndex] = useState(0);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setTwitterData({
        totalTweets: 247,
        keywords: ['banjir', 'flood', 'sabah', 'kota kinabalu', 'evacuate', 'emergency'],
        trending: '#SabahFloods',
        lastUpdated: new Date().toLocaleTimeString()
      });

      setWeatherData({
        currentCondition: 'Heavy Rain',
        rainfall: '85mm in 6 hours',
        forecast: 'Continued heavy rainfall expected',
        riskLevel: 'CRITICAL',
        lastUpdated: new Date().toLocaleTimeString()
      });

      setOfficialNews([
        {
          title: 'Sabah State Government Issues Emergency Flood Warning',
          source: 'Sabah State Disaster Management',
          time: '2 hours ago',
          summary: 'Immediate evacuation ordered for low-lying areas in Kota Kinabalu and Penampang districts.'
        },
        {
          title: 'Malaysian Meteorological Department: Heavy Rain Alert Extended',
          source: 'MetMalaysia',
          time: '4 hours ago',
          summary: 'Red alert issued for Sabah with rainfall expected to continue for next 48 hours.'
        },
        {
          title: 'Emergency Shelters Activated Across Sabah',
          source: 'Malaysian Red Crescent',
          time: '6 hours ago',
          summary: '15 emergency shelters now operational with capacity for 5,000 evacuees.'
        }
      ]);
      
      // Fetch live tweets from database
      fetchLiveTweets();
    }, 1000);
  }, []);
  
  const fetchLiveTweets = async () => {
    try {
      const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/tweets');
      const result = await response.json();
      setLiveTweets(result.tweets || []);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      // Fallback mock data
      setLiveTweets([
        { content: 'Heavy flooding in Kota Kinabalu city center. Roads impassable. #SabahFloods', post_time: new Date().toISOString(), likes_count: 45 },
        { content: 'Emergency shelters open at Penampang Community Center. Please spread the word! #FloodRelief', post_time: new Date().toISOString(), likes_count: 78 },
        { content: 'Water level rising rapidly near Likas Bay area. Residents advised to evacuate immediately.', post_time: new Date().toISOString(), likes_count: 123 }
      ]);
    }
  };
  
  useEffect(() => {
    if (liveTweets.length > 0) {
      const interval = setInterval(() => {
        setCurrentTweetIndex((prev) => (prev + 1) % liveTweets.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [liveTweets]);

  return (
    <div className="news-dashboard" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>News Dashboard</h1>
      <div className="news-header" style={{ 
        backgroundColor: 'rgba(244, 244, 244, 1)', 
        border: '1px solid rgba(239, 234, 228, 1)', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0', color: '#dc3545' }}>📍 {focusLocation}</h2>
        <p style={{ margin: '5px 0 0 0', color: '#383a3bff' }}>
          Real-time monitoring and updates
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '20px' 
      }}>
        
        {/* Twitter Analytics Box */}
        <div style={{ 
          border: '1px solid rgba(239, 234, 228, 1)', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: 'rgba(244, 244, 244, 1)'
        }}>
          <h3 style={{ color: '#1da1f2', marginTop: '0' }}>🐦 Social Media Analytics</h3>
          {twitterData ? (
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1da1f2' }}>
                {twitterData.totalTweets.toLocaleString()} tweets
              </div>
              <p style={{ color: '#6c757d', fontSize: '14px' }}>
                Last updated: {twitterData.lastUpdated}
              </p>
              
              <div style={{ marginTop: '15px', color: 'black' }}>
                <strong>Trending Keywords:</strong>
                <div style={{ marginTop: '8px' }}>
                  {twitterData.keywords.map((keyword, index) => (
                    <span key={index} style={{
                      display: 'inline-block',
                      backgroundColor: 'rgba(211, 241, 255, 1)',
                      color: '#1976d2',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      margin: '2px',
                      border: '1px solid #bbdefb'
                    }}>
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
              
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#dfeef6ff', borderRadius: '4px',color: '#000000ff' }}>
                <strong>Trending Hashtag: <span style={{ color: '#1da1f2' }}>{twitterData.trending}</span></strong>
              </div>
            </div>
          ) : (
            <div style={{color: 'black'}}>Loading social media data...</div>
          )}
        </div>

        {/* Weather/Meteorology Box */}
        <div style={{ 
          border: '1px solid rgba(239, 234, 228, 1)', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: 'rgba(244, 244, 244, 1)'
        }}>
          <h3 style={{ color: '#28a745', marginTop: '0' }}>🌧️ Meteorological Report</h3>
          {weatherData ? (
            <div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: weatherData.riskLevel === 'CRITICAL' ? '#dc3545' : '#28a745' 
              }}>
                {weatherData.currentCondition}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#dc3545',
                fontWeight: 'bold',
                marginTop: '5px'
              }}>
                Risk Level: {weatherData.riskLevel}
              </div>
              <p style={{ color: '#6c757d', fontSize: '14px' }}>
                Last updated: {weatherData.lastUpdated}
              </p>
              
              <div style={{ marginTop: '15px', color: 'black' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Rainfall:</strong> {weatherData.rainfall}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Forecast:</strong> {weatherData.forecast}
                </div>
              </div>
              
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '4px',
                border: '1px solid #ffeaa7',
                color: '#000000ff'
              }}>
                <strong>⚠️ Warning:</strong> Avoid travel in affected areas
              </div>
            </div>
          ) : (
            <div style={{color: 'black'}}>Loading weather data...</div>
          )}
        </div>

        {/* Live Tweet Feed Box */}
        <div style={{ 
          border: '1px solid #dee2e6', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: 'rgba(244, 244, 244, 1)'
        }}>
          <h3 style={{ color: '#1da1f2', marginTop: '0' }}>📱 Live Tweet Feed</h3>
          {liveTweets.length > 0 ? (
            <div style={{ color: 'black', minHeight: '150px' }}>
              <div style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '14px', lineHeight: '1.4', marginBottom: '10px' }}>
                  {liveTweets[currentTweetIndex]?.content}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{new Date(liveTweets[currentTweetIndex]?.post_time).toLocaleString()}</span>
                  <span>❤️ {liveTweets[currentTweetIndex]?.likes_count || 0}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#6c757d' }}>
                Tweet {currentTweetIndex + 1} of {liveTweets.length} • Updates every 5 seconds
              </div>
            </div>
          ) : (
            <div style={{ color: 'black' }}>Loading live tweets...</div>
          )}
        </div>

        {/* Official News Box */}
        <div style={{ 
          border: '1px solid #dee2e6', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: 'rgba(244, 244, 244, 1)'
        }}>
          <h3 style={{ color: '#dc3545', marginTop: '0' }}>📰 Official News Updates</h3>
          {officialNews ? (
            <div style={{color:'black'}}>
              {officialNews.map((news, index) => (
                <div key={index} style={{ 
                  marginBottom: '15px', 
                  paddingBottom: '15px',
                  borderBottom: index < officialNews.length - 1 ? '1px solid #e9ecef' : 'none'
                }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', lineHeight: '1.3' }}>
                    {news.title}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>
                    <strong>{news.source}</strong> • {news.time}
                  </div>
                  <p style={{ margin: '0', fontSize: '13px', color: '#495057' }}>
                    {news.summary}
                  </p>
                </div>
              ))}
              
              <div style={{ 
                marginTop: '15px', 
                textAlign: 'center',
                padding: '10px',
                backgroundColor: 'rgba(239, 234, 228, 1)',
                borderRadius: '4px'
              }}>
                <small style={{ color: '#6c757d' }}>
                  Updates refresh every 15 minutes
                </small>
              </div>
            </div>
          ) : (
            <div style={{color: 'black'}}>Loading official news...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsDashboard;