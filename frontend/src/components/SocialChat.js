import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SocialChat = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  
  const chatEndRef = useRef(null);
  const token = localStorage.getItem('token');
  const myUserId = localStorage.getItem('username'); // Used for rendering labels

  const loadSocialData = async () => {
    try {
      const res = await axios.get('https://cloudscope-portal-built-using-mern-stack.onrender.com/api/social/friends-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(res.data.friends);
      setPendingRequests(res.data.pendingRequests);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSocialData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    try {
      const res = await axios.get(`https://cloudscope-portal-built-using-mern-stack.onrender.com/api/social/search?email=${searchEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFoundUser(res.data);
    } catch (err) {
      setFoundUser(null);
      setStatusMsg(err.response?.data?.message || 'User search failed');
    }
  };

  const sendFriendRequest = async () => {
    try {
      await axios.post('https://cloudscope-portal-built-using-mern-stack.onrender.com/api/social/request', { recipientId: foundUser._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMsg('Request sent!');
      setFoundUser(null);
      setSearchEmail('');
      loadSocialData();
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleResponse = async (friendshipId, status) => {
    try {
      await axios.put('https://cloudscope-portal-built-using-mern-stack.onrender.com/api/social/respond', { friendshipId, status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadSocialData();
    } catch (err) {
      console.error(err);
    }
  };

  const selectFriend = async (friend) => {
    setActiveFriend(friend);
    try {
      const res = await axios.get(`https://cloudscope-portal-built-using-mern-stack.onrender.com/api/social/messages/${friend._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeFriend) return;

    try {
      const res = await axios.post('https://cloudscope-portal-built-using-mern-stack.onrender.com/api/social/message', {
        recipientId: activeFriend._id,
        text: messageInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages([...chatMessages, res.data]);
      setMessageInput('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="social-chat-layout" style={{ display: 'flex', gap: '20px', padding: '20px', height: '70vh', background: '#0f172a', borderRadius: '12px', color: 'white' }}>
      {/* Sidebar Section */}
      <div className="social-sidebar" style={{ width: '30%', borderRight: '1px solid #334155', paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <h3>Find Friends</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '5px' }}>
          <input type="email" placeholder="Search by email..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white' }} />
          <button type="submit" style={{ padding: '8px', background: '#4f46e5', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>Search</button>
        </form>
        {statusMsg && <p style={{ fontSize: '0.85rem', color: '#f87171' }}>{statusMsg}</p>}
        {foundUser && (
          <div style={{ background: '#1e293b', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
            <span>{foundUser.username}</span>
            <button onClick={sendFriendRequest} style={{ background: '#22c55e', border: 'none', padding: '5px 10px', borderRadius: '4px', color: 'white', cursor: 'pointer', marginLeft: 'auto' }}>Add</button>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div>
            <h4>Pending Invites</h4>
            {pendingRequests.map(req => (
              <div key={req.friendshipId} style={{ display: 'flex', background: '#334155', padding: '8px', borderRadius: '6px', marginBottom: '5px', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem' }}>{req.username}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => handleResponse(req.friendshipId, 'accepted')} style={{ background: '#22c55e', border: 'none', padding: '3px 6px', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>✓</button>
                  <button onClick={() => handleResponse(req.friendshipId, 'rejected')} style={{ background: '#ef4444', border: 'none', padding: '3px 6px', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <h4>My Friends</h4>
          {friends.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No friends added yet.</p> : (
            friends.map(f => (
              <div key={f._id} onClick={() => selectFriend(f)} style={{ padding: '10px', background: activeFriend?._id === f._id ? '#4f46e5' : '#1e293b', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px', transition: '0.2s' }}>
                <strong>{f.username}</strong>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{f.email}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Conversation Section */}
      <div className="social-chat-window" style={{ width: '70%', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {activeFriend ? (
          <>
            <div style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}>
              <h3>Chatting with {activeFriend.username}</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#111827', borderRadius: '8px' }}>
              {chatMessages.map((msg, i) => {
                const isMe = msg.sender === activeFriend._id ? false : true;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ background: isMe ? '#4f46e5' : '#334155', padding: '8px 12px', borderRadius: '12px', maxWidth: '70%', fontSize: '0.95rem' }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', marginTop: '10px', gap: '10px' }}>
              <input type="text" placeholder="Type a secure message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white' }} />
              <button type="submit" style={{ padding: '12px 20px', background: '#22c55e', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
            <h3>Select a friend from the sidebar to start secure messaging</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialChat;