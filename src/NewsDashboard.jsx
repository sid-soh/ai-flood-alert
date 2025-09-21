import React, { useState, useEffect } from 'react';

const NewsDashboard = () => {
  const [focusLocation, setFocusLocation] = useState('Sabah Flood Crisis');
  const [twitterData, setTwitterData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [officialNews, setOfficialNews] = useState(null);

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
    }, 1000);
  }, []);

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