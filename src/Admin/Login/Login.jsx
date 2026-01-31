import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { API_BASE_URL } from '../../../Config';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // NEW: Loading state
  const navigate = useNavigate();

  const styles = {
    input: { 
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", 
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)", 
      border: "1px solid rgba(2,132,199,0.3)", 
      borderDark: "1px solid rgba(59,130,246,0.4)"
    },
    button: { 
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", 
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)", 
      border: "1px solid rgba(125,211,252,0.4)", 
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Start loading

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Login failed');

      // Save to localStorage
      localStorage.setItem('username', data.username);
      localStorage.setItem('userType', data.type);

      // Role-based navigation
      if (data.type === 'admin') {
        navigate('/inventory');
      } else {
        navigate('/godown');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false); // Stop loading on error
    }
    // Note: No setLoading(false) on success — navigation happens, component unmounts
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Login
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-3 rounded-lg mb-4 text-center shadow-md sm:text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-300">
              Username
            </label>
            <div className="mt-2">
              <input 
                type="text" 
                name="username" 
                id="username" 
                autoComplete="username" 
                required 
                disabled={loading}
                className="block w-full rounded-md px-3 py-1.5 text-base text-gray-900 dark:text-gray-900 bg-white dark:bg-gray-900 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm/6 disabled:opacity-70"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ 
                  background: styles.input.background, 
                  backgroundDark: styles.input.backgroundDark, 
                  border: styles.input.border, 
                  borderDark: styles.input.borderDark, 
                  backdropFilter: styles.input.backdropFilter 
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-300">
                Password
              </label>
            </div>
            <div className="mt-2 relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                id="password" 
                autoComplete="current-password" 
                required 
                disabled={loading}
                className="block w-full rounded-md px-3 py-1.5 text-base text-gray-900 dark:text-gray-900 bg-white dark:bg-gray-900 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm/6 disabled:opacity-70"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  background: styles.input.background, 
                  backgroundDark: styles.input.backgroundDark, 
                  border: styles.input.border, 
                  borderDark: styles.input.borderDark, 
                  backdropFilter: styles.input.backdropFilter 
                }}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400 dark:text-sky-900" />
                ) : (
                  <AiOutlineEye className="h-5 w-5 text-gray-400 dark:text-sky-900" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              disabled={loading}
              className="flex w-full justify-center items-center rounded-md px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-700 dark:hover:bg-blue-600 sm:text-sm/6 disabled:opacity-70 disabled:cursor-not-allowed relative"
              style={{ 
                background: styles.button.background, 
                backgroundDark: styles.button.backgroundDark, 
                border: styles.button.border, 
                borderDark: styles.button.borderDark, 
                boxShadow: styles.button.boxShadow, 
                boxShadowDark: styles.button.boxShadowDark 
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        [style*="backgroundDark"] { background: var(--bg, ${styles.input.background}); }
        [style*="backgroundDark"][data-dark] { --bg: ${styles.input.backgroundDark}; }
        [style*="borderDark"] { border: var(--border, ${styles.input.border}); }
        [style*="borderDark"][data-dark] { --border: ${styles.input.borderDark}; }
        [style*="boxShadowDark"] { box-shadow: var(--shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow: ${styles.button.boxShadowDark}; }
      `}</style>
    </div>
  );
}