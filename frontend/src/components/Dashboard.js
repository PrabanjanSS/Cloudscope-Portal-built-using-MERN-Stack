import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SocialChat from './SocialChat';

const Dashboard = () => {
  const [city, setCity] = useState('Chennai');
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState('');
  
  // Chatbot State Variables
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am SkyBot. Ask me anything about weather setups or packing tips!' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  // 🆕 Track active view tab ('weather' or 'social')
  const [activeTab, setActiveTab] = useState('weather'); 

  const messagesEndRef = useRef(null);
  const username = localStorage.getItem('username');

  // 1. Fetch current weather conditions
  const fetchWeather = async () => {
    setWeatherError('');
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`http://localhost:5003/api/weather/${city}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeather(res.data);
    } catch (err) {
      setWeatherError(err.response?.data?.message || 'Failed to fetch weather');
      setWeather(null);
    }
  };

  // 2. Fetch conversational history from MongoDB when the dashboard loads
  const fetchChatHistory = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:5003/api/chatbot/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.length > 0) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Could not load chat history from database:", err);
    }
  };

  // Triggers automatically on login
  useEffect(() => {
    fetchWeather();
    fetchChatHistory();
  }, []);

  // Auto-scroll chat box to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // Chat Submission Logic
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { sender: 'user', text: chatInput };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:5003/api/chatbot', 
        { message: chatInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, my server circuits got jammed.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#1e293b', color: 'white' }}>
        <h1>CloudScope Dashboard</h1>
        
        {/* 🆕 Navigation Tab Switches inside Navbar */}
        <div className="nav-tabs" style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('weather')} 
            style={{ 
              background: activeTab === 'weather' ? '#4f46e5' : 'transparent', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              transition: '0.2s'
            }}
          >
            🌤 Weather Engine
          </button>
          <button 
            onClick={() => setActiveTab('social')} 
            style={{ 
              background: activeTab === 'social' ? '#4f46e5' : 'transparent', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              transition: '0.2s'
            }}
          >
            👥 Social Sync Chat
          </button>
        </div>

        <div className="nav-right">
          <span>Welcome, <strong>{username}</strong>!</span>
          <button onClick={handleLogout} className="logout-btn" style={{ marginLeft: '15px' }}>Logout</button>
        </div>
      </nav>

      {/* 🆕 Conditional Rendering Based On Selected Tab */}
      {activeTab === 'weather' ? (
        <div className="main-content">
          <div className="search-box">
            <input type="text" placeholder="Enter city name..." value={city} onChange={(e) => setCity(e.target.value)} />
            <button onClick={fetchWeather}>Search Weather</button>
          </div>

          {weatherError && <p className="error-msg text-center">{weatherError}</p>}

          {weather && (
            <div className="weather-card">
              <h2>{weather.name}, {weather.sys.country}</h2>
              <div className="weather-main">
                <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt="weather icon" />
                <h3>{weather.main.temp}°C</h3>
              </div>
              <p className="description">{weather.weather[0].description}</p>
              <div className="weather-details">
                <div>💧 Humidity: {weather.main.humidity}%</div>
                <div>💨 Wind Speed: {weather.wind.speed} m/s</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="social-content" style={{ padding: '20px' }}>
          <SocialChat />
        </div>
      )}

      {/* --- Floating SkyBot Chat Widget --- */}
      <div className={`chat-widget ${isChatOpen ? 'open' : ''}`}>
        <button className="chat-toggle-btn" onClick={() => setIsChatOpen(!isChatOpen)}>
          {isChatOpen ? '✖ Close Chat' : '💬 Ask SkyBot'}
        </button>
        
        {isChatOpen && (
          <div className="chat-window">
            <div className="chat-header">SkyBot Assistant</div>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`chat-bubble-wrapper ${msg.sender}`}>
                  <div className={`chat-bubble ${msg.sender}`}>{msg.text}</div>
                </div>
              ))}
              {isTyping && <div className="chat-bubble bot typing">Thinking...</div>}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input type="text" placeholder="Ask about weather trends..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
              <button type="submit">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;