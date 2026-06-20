import { useState, useEffect } from 'react';
import api from './api';

function App() {
  // ==========================================
  // 1. APPLICATION COMPONENT STATES Lifecycle
  // ==========================================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Profile, Events, and User Management structures
  const [profileData, setProfileData] = useState(null);
  const [events, setEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  // Create Form tracking targets
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('0');
  
  // Category categorizations & layout filtering parameters
  const [category, setCategory] = useState('Tech');
  const [customCategory, setCustomCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Bootup check: Verifies if a user has an active token session stored locally
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setSuccess(true);
      fetchProfile();
      fetchEvents();
    }
  }, []);

  // Structural watch hook: Automatically extracts network users if current profile is validated as Admin
  useEffect(() => {
    if (profileData && profileData.role === 'admin') {
      fetchUsers();
    }
  }, [profileData]);

  // ==========================================
  // 2. NETWORK CONTEXT API OPERATION HANDLING
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // URL Encoding payloads to comply natively with FastAPI OAuth2 structural protocols
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/login', formData);
      localStorage.setItem('token', response.data.access_token);
      setSuccess(true);
      fetchProfile();
      fetchEvents();
    } catch (err) {
      setError('Incorrect email username or password configuration. Try again!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setSuccess(false);
    setProfileData(null);
    setEvents([]);
    setAllUsers([]);
    setEmail(''); setPassword('');
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfileData(res.data);
    } catch (err) {
      handleLogout();
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to sync system announcements map.");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setAllUsers(res.data);
    } catch (err) {
      console.error("Failed to extract active platform users nodes.");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const chosenCategory = category === 'Other' ? customCategory.trim() : category;
    if (!chosenCategory) return alert("Please specify a custom category designation.");

    try {
      await api.post('/events', { 
        title, description, location, date, time, 
        category: chosenCategory,
        max_capacity: parseInt(maxCapacity, 10) || 0 
      });
      // Clear forms completely on deployment loop success
      setTitle(''); setDescription(''); setLocation(''); setDate(''); setTime('');
      setCategory('Tech'); setCustomCategory(''); setMaxCapacity('0');
      fetchEvents();
    } catch (err) {
      alert("Failed to build out new announcement node.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event permanently?")) return;
    try {
      await api.delete(`/events/${eventId}`);
      fetchEvents();
    } catch (err) {
      alert("Failed to drop event link.");
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/register`);
      fetchEvents(); 
    } catch (err) {
      alert("Failed to execute membership toggle matrix request.");
    }
  };

  const handleToggleComplete = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/toggle-complete`);
      fetchEvents();
    } catch (err) {
      alert("Failed to transform announcement archival status.");
    }
  };

  // ==========================================
  // 3. OPERATIONAL METRIC ANALYTICS LOGIC
  // ==========================================
  const computeAnalytics = () => {
    const totalActive = events.filter(e => !e.is_completed).length;
    let totalMembersCount = 0;
    const categoryCounts = {};
    
    events.forEach(e => {
      totalMembersCount += e.attendees.length;
      if (!e.is_completed) {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      }
    });

    let topCategory = "None";
    let maxCount = 0;
    Object.keys(categoryCounts).forEach(cat => {
      if (categoryCounts[cat] > maxCount) {
        maxCount = categoryCounts[cat];
        topCategory = cat;
      }
    });

    return { totalActive, totalMembersCount, topCategory };
  };

  const analytics = computeAnalytics();
  
  // Security Layer Checks: Establishes context flags tracking authorization layout options
  const isManagement = profileData && (profileData.role === 'admin' || profileData.role === 'organizer');

  // Filtering matrices setup
  const filteredEvents = activeFilter === 'All'
    ? events
    : events.filter(evt => evt.category?.toLowerCase() === activeFilter.toLowerCase());

  const activeEvents = filteredEvents.filter(evt => !evt.is_completed);
  const archivedEvents = filteredEvents.filter(evt => evt.is_completed);

  // ==========================================
  // 4. CHRONOLOGICAL CARD RENDER COMPONENT
  // ==========================================
  const renderEventCard = (evt) => {
    // Check if current user is inside the array array of attendees
    const userIndex = profileData ? evt.attendees.findIndex(att => att.id === profileData.id) : -1;
    const isSignedUp = userIndex !== -1;
    
    // Algorithmic waitlist check: Calculates insertion positioning relative to maximum capacity bounds
    const hasCap = evt.max_capacity > 0;
    const isWaitlisted = hasCap && isSignedUp && (userIndex >= evt.max_capacity);
    const isFull = hasCap && !isSignedUp && (evt.attendees.length >= evt.max_capacity);

    const isOwnerOrAdmin = profileData && (profileData.role === 'admin' || profileData.id === evt.owner_id);

    return (
      <div 
        key={evt.id} 
        className="animate-fade bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors duration-200 relative space-y-4"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-gray-800 text-gray-300 px-3 py-1 rounded border border-gray-700/30">
              {evt.category}
            </span>
            <h3 className="text-xl font-bold text-white pt-1">{evt.title}</h3>
          </div>
          
          {isOwnerOrAdmin && (
            <button 
              onClick={() => handleDeleteEvent(evt.id)} 
              className="text-gray-400 hover:text-red-400 bg-black/40 hover:bg-black border border-gray-800 px-3.5 py-1.5 text-sm font-semibold rounded-lg hover:opacity-90 active:opacity-70 transition-all duration-150 cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-400 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>📅 {evt.date} at {evt.time}</span>
          <span>📍 {evt.location}</span>
          <span className="bg-black/30 border border-gray-800/60 text-gray-300 px-2.5 py-0.5 rounded">
            👥 {evt.attendees.length}{hasCap ? ` / ${evt.max_capacity}` : ''} members
          </span>
        </p>
        
        <p className="text-gray-300 text-base leading-relaxed">{evt.description}</p>
        
        {/* Management view block mapping out chronological waitlists based on position records */}
        {isOwnerOrAdmin && evt.attendees.length > 0 && (
          <div className="bg-black/30 p-4 rounded-lg border border-gray-800/60 space-y-2">
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Registered Members</p>
            <div className="flex flex-wrap gap-2">
              {evt.attendees.map((att, index) => {
                const onWaitlist = hasCap && (index >= evt.max_capacity);
                return (
                  <span 
                    key={att.id} 
                    className={`text-sm px-3 py-1 rounded font-medium border ${
                      onWaitlist ? 'bg-amber-950/40 text-amber-400 border-amber-900/30' : 'bg-gray-800/60 text-gray-300 border-gray-700/20'
                    }`}
                  >
                    {att.name} {onWaitlist ? '(Waitlist)' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-800/60 flex justify-between items-center text-sm">
          <div className="text-gray-400">
            By <span className="text-white font-medium">{evt.owner.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwnerOrAdmin && (
              <button 
                onClick={() => handleToggleComplete(evt.id)} 
                className={`px-4 py-2 rounded-lg font-semibold border text-sm hover:opacity-90 active:opacity-70 transition-all duration-150 cursor-pointer ${
                  evt.is_completed 
                    ? 'bg-blue-950/40 text-blue-400 border-blue-900/40' 
                    : 'bg-gray-800 text-gray-300 border-gray-700/80'
                }`}
              >
                {evt.is_completed ? '↩ Move Active' : '✓ Archive'}
              </button>
            )}

            {!evt.is_completed && (
              <button 
                onClick={() => handleRegister(evt.id)}
                disabled={isFull && !isSignedUp}
                className={`px-5 py-2 rounded-lg font-bold tracking-wide text-sm hover:opacity-90 active:opacity-70 transition-all duration-150 cursor-pointer ${
                  isWaitlisted 
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-900/40' 
                    : isSignedUp 
                    ? 'bg-green-950/60 text-green-400 border border-green-900/40' 
                    : isFull 
                    ? 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed opacity-40' 
                    : 'bg-white text-black'
                }`}
              >
                {isWaitlisted ? '✓ Waitlisted' : isSignedUp ? '✓ Registered' : isFull ? 'Event Full' : 'Register'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 5. CORE APPLICATION GRAPHICS CORE MAIN LAYOUT
  // ==========================================
  if (success) {
    return (
      <div className="min-h-screen bg-black text-white p-4 sm:p-8 animate-fade">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Dashboard Application Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-800 pb-4 gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Eventum</h1>
              <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Plan. Connect. Celebrate.</p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-5">
              {profileData && (
                <p className="text-gray-300 text-base">
                  Logged in as <span className="text-white font-medium">{profileData.name}</span> <span className="text-sm text-gray-500 capitalize">({profileData.role})</span>
                </p>
              )}
              <button onClick={handleLogout} className="text-sm bg-red-950/40 hover:bg-red-900/30 text-red-200 border border-red-900/40 px-3.5 py-2 rounded-lg active:opacity-70 transition-opacity font-semibold cursor-pointer">
                Log Out
              </button>
            </div>
          </div>

          {/* Core Analytics Banner System: Only visible to authorized management personnel */}
          {isManagement && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-gray-800 bg-gray-950/50 p-4 rounded-xl">
              <div className="p-4 bg-black/20 border border-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Board</p>
                <p className="text-2xl font-bold mt-1 text-white">{analytics.totalActive} <span className="text-sm text-gray-400 font-normal">Events</span></p>
              </div>
              <div className="p-4 bg-black/20 border border-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Network Volume</p>
                <p className="text-2xl font-bold mt-1 text-emerald-400">{analytics.totalMembersCount} <span className="text-sm text-gray-400 font-normal">Members</span></p>
              </div>
              <div className="p-4 bg-black/20 border border-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Trending Sector</p>
                <p className="text-xl font-bold mt-1 text-blue-400 truncate uppercase tracking-tight">{analytics.topCategory}</p>
              </div>
            </div>
          )}

          {/* Master Splitting Grid System: Handles responsive full width stretching dynamically for audience roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Create Panel Form: Locked strictly away from audience layers */}
            {isManagement && (
              <div className="col-span-1 bg-gray-900 p-5 sm:p-6 rounded-xl border border-gray-800 h-fit">
                <h2 className="text-lg font-bold mb-4 uppercase tracking-wide text-gray-200">Create New Event</h2>
                <form className="space-y-4" onSubmit={handleCreateEvent}>
                  <div>
                    <label className="block text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Event Title</label>
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg focus:border-gray-600 transition-colors outline-none text-white text-base" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Description</label>
                    <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg focus:border-gray-600 transition-colors outline-none text-white text-base" rows="2" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Location</label>
                    <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg focus:border-gray-600 transition-colors outline-none text-white text-base" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg focus:border-gray-600 transition-colors outline-none text-white text-base cursor-pointer">
                        <option value="Tech">Tech</option>
                        <option value="Sports">Sports</option>
                        <option value="Culturals">Culturals</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Max Capacity</label>
                      <input type="number" min="0" required value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg focus:border-gray-600 transition-colors outline-none text-white text-base" placeholder="0 = No limit" />
                    </div>
                  </div>

                  {/* Micro drawer for inputting custom tags if 'Other' is picked */}
                  <div className={`category-input-enter ${category === 'Other' ? 'active' : ''}`}>
                    <label className="block text-blue-400 text-sm font-semibold uppercase tracking-wider mb-1">Specify Category Name</label>
                    <input type="text" required={category === 'Other'} value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="e.g. Charity" className="w-full bg-black border border-blue-900/60 p-2.5 rounded-lg focus:border-blue-500 outline-none text-white placeholder-gray-700 text-base" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Date</label>
                      <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg focus:border-gray-600 transition-colors outline-none text-white text-base [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Time</label>
                      <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg focus:border-gray-600 transition-colors outline-none text-white text-base [color-scheme:dark]" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-lg hover:opacity-90 active:opacity-70 transition-opacity cursor-pointer mt-2 tracking-wide uppercase text-sm">
                    Publish Announcement
                  </button>
                </form>
              </div>
            )}

            {/* Dynamic Content Streams: Switches instantly between col-span-2 and full page width grid scales */}
            <div className={`${isManagement ? 'col-span-2' : 'col-span-3'} space-y-10`}>
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Active Board</h2>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Tech', 'Sports', 'Culturals'].map((filterName) => (
                      <button 
                        key={filterName} 
                        onClick={() => setActiveFilter(filterName)} 
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full border transition-all cursor-pointer ${
                          activeFilter === filterName 
                            ? 'bg-white text-black border-white' 
                            : 'bg-black text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                        }`}
                      >
                        {filterName}
                      </button>
                    ))}
                  </div>
                </div>

                {activeEvents.length === 0 ? (
                  <p className="text-gray-500 italic text-base py-2">No live announcements available.</p>
                ) : (
                  <div className="space-y-4">{activeEvents.map(renderEventCard)}</div>
                )}
              </div>

              {/* Archived Content Folders */}
              <div className="border-t border-gray-800 pt-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Archived Directory Folder</h2>
                {archivedEvents.length === 0 ? (
                  <p className="text-gray-500 italic text-base">Directory empty.</p>
                ) : (
                  <div className="space-y-4 opacity-50 hover:opacity-80 transition-opacity duration-200">
                    {archivedEvents.map(renderEventCard)}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Root Level Node Administration Module */}
          {profileData && profileData.role === 'admin' && (
            <div className="border-t border-gray-800 pt-6 mt-4">
              <h2 className="text-sm font-bold tracking-wider uppercase text-red-500 mb-3">Global Node Audit</h2>
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-800 bg-black text-gray-400 text-xs uppercase font-bold tracking-wider">
                      <th className="p-4">Node ID</th>
                      <th className="p-4">Identity</th>
                      <th className="p-4">Network Address</th>
                      <th className="p-4">Access Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800/40 hover:bg-black/20 text-base text-gray-300 transition-colors">
                        <td className="p-4 text-gray-500 font-mono text-sm">#00{user.id}</td>
                        <td className="p-4 font-medium text-white">{user.name}</td>
                        <td className="p-4 text-gray-400 font-mono text-sm">{user.email}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${
                            user.role === 'admin' ? 'bg-red-950/40 text-red-400 border-red-900/40' : 'bg-blue-950/40 text-blue-400 border-blue-900/40'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ==========================================
  // 6. INITIAL USER SIGN-IN SECURE PORTAL
  // ==========================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-sm mx-4 animate-fade">
        <h1 className="text-4xl font-bold text-white mb-1 text-center tracking-tight">Eventum</h1>
        <p className="text-gray-400 text-xs font-semibold uppercase text-center tracking-widest mb-8">Plan. Connect. Celebrate.</p>
        
        {error && (
          <div className="bg-red-950/50 border border-red-900/40 text-red-300 p-3 rounded-lg mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black border border-gray-800 p-3 rounded-xl focus:border-gray-600 transition-colors outline-none text-white text-base" />
          </div>
          <div>
            <label className="block text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black border border-gray-800 p-3 rounded-xl focus:border-gray-600 transition-colors outline-none text-white text-base" />
          </div>
          <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:opacity-90 active:opacity-70 transition-opacity mt-2 cursor-pointer tracking-wider uppercase text-sm">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;