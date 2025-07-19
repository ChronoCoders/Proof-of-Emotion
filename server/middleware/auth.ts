// Serve login page
  const loginHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EmotionalChain - Login</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }
    
    .login-container {
      background: rgba(20, 25, 40, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 2rem;
      width: 320px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .logo {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .logo h1 {
      color: #00ff00;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
    }
    
    .logo p {
      color: #888;
      font-size: 0.8rem;
    }
    
    .form-group {
      margin-bottom: 1.2rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.9rem;
    }
    
    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      font-size: 1rem;
      background: rgba(0, 0, 0, 0.3);
      color: #ffffff;
      transition: all 0.3s ease;
    }
    
    input[type="text"]:focus,
    input[type="password"]:focus {
      outline: none;
      border-color: #00ff00;
      box-shadow: 0 0 0 2px rgba(0, 255, 0, 0.2);
    }
    
    input::placeholder {
      color: #666;
    }
    
    .login-btn {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #00ff00 0%, #00cc00 100%);
      color: #000000;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .login-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
    }
    
    .login-btn:active {
      transform: translateY(0);
    }
    
    @media (max-width: 480px) {
      .login-container {
        width: 90%;
        max-width: 320px;
        padding: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">
      <h1>🧠 EmotionalChain</h1>
      <p>Proof of Emotion Consensus Platform</p>
    </div>
    
    <form action="/auth/login" method="POST" id="loginForm">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required placeholder="chronocoder">
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required placeholder="talber1726">
      </div>
      
      <button type="submit" class="login-btn">Access EmotionalChain</button>
    </form>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      const btn = document.querySelector('.login-btn');
      btn.textContent = 'Authenticating...';
      btn.disabled = true;
    });
    
    window.onload = function() {
      document.getElementById('username').focus();
    };
  </script>
</body>
</html>`;import type { Request, Response, NextFunction } from 'express';

// Hardcoded credentials
const VALID_USERNAME = 'chronocoder';
const VALID_PASSWORD = 'talber1726';

interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check if user is authenticated via session
  if (req.session && req.session.authenticated) {
    req.isAuthenticated = true;
    return next();
  }

  // For API requests, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ 
      message: 'Authentication required',
      error: 'Please login to access EmotionalChain APIs'
    });
  }

  // For web requests, redirect to login
  return res.redirect('/login');
}

export function loginHandler(req: Request, res: Response) {
  const { username, password } = req.body;

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    // Set session
    req.session.authenticated = true;
    req.session.username = username;
    req.session.loginTime = new Date().toISOString();

    console.log(`🔐 EmotionalChain: User "${username}" logged in successfully`);
    
    // Redirect to root (which should work with your React router)
    return res.redirect('/');
  }

  // Invalid credentials
  console.log(`❌ EmotionalChain: Failed login attempt for "${username}"`);
  return res.status(401).json({ 
    message: 'Invalid credentials',
    error: 'Username or password incorrect'
  });
}

export function logoutHandler(req: Request, res: Response) {
  const username = req.session?.username || 'Unknown';
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    console.log(`🔐 EmotionalChain: User "${username}" logged out`);
  });

  res.redirect('/login');
}

export function loginPageHandler(req: Request, res: Response) {
  // If already authenticated, redirect to root
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }

  // Serve login page
  const loginHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EmotionalChain - Login</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .login-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 3rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .logo {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .logo h1 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .logo p {
      color: #666;
      font-size: 0.9rem;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 600;
      font-size: 0.9rem;
    }
    
    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e1e5e9;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.8);
    }
    
    input[type="text"]:focus,
    input[type="password"]:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .login-btn {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .login-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .login-btn:active {
      transform: translateY(0);
    }
    
    .error {
      background: #fee;
      color: #c33;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      border: 1px solid #fcc;
      font-size: 0.9rem;
    }
    
    .features {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
    }
    
    .features h3 {
      color: #333;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      text-align: center;
    }
    
    .features ul {
      list-style: none;
      font-size: 0.8rem;
      color: #666;
    }
    
    .features li {
      padding: 0.25rem 0;
    }
    
    .features li:before {
      content: "🧠";
      margin-right: 0.5rem;
    }
    
    .version {
      text-align: center;
      margin-top: 1.5rem;
      color: #999;
      font-size: 0.8rem;
    }
    
    .credentials-hint {
      background: rgba(102, 126, 234, 0.1);
      border: 1px solid rgba(102, 126, 234, 0.2);
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
      font-size: 0.8rem;
      color: #333;
    }
    
    .credentials-hint h4 {
      margin-bottom: 0.5rem;
      color: #667eea;
      font-size: 0.9rem;
    }
    
    .cred-item {
      display: flex;
      justify-content: space-between;
      margin: 0.25rem 0;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">
      <h1>🧠 EmotionalChain</h1>
      <p>Proof of Emotion Consensus Platform</p>
    </div>
    
    <form action="/auth/login" method="POST" id="loginForm">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autocomplete="username" placeholder="Enter username">
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Enter password">
      </div>
      
      <button type="submit" class="login-btn">Access EmotionalChain</button>
    </form>
    
    <div class="credentials-hint">
      <h4>🔑 Demo Credentials</h4>
      <div class="cred-item">
        <span>Username:</span>
        <span><strong>chronocoder</strong></span>
      </div>
      <div class="cred-item">
        <span>Password:</span>
        <span><strong>talber1726</strong></span>
      </div>
    </div>
    
    <div class="features">
      <h3>Platform Features</h3>
      <ul>
        <li>Emotion-based consensus mechanism</li>
        <li>Real-time biometric validation</li>
        <li>Stake-weighted emotional agreement</li>
        <li>Advanced analytics dashboard</li>
        <li>Enterprise-grade security</li>
      </ul>
    </div>
    
    <div class="version">
      EmotionalChain v1.0.0 | Proof of Emotion
    </div>
  </div>

  <script>
    // Simple form validation and UX enhancement
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      
      if (!username || !password) {
        e.preventDefault();
        alert('Please enter both username and password');
        return;
      }
      
      // Add loading state
      const btn = document.querySelector('.login-btn');
      btn.textContent = 'Authenticating...';
      btn.disabled = true;
    });
    
    // Auto-focus username field
    window.onload = function() {
      document.getElementById('username').focus();
    };
    
    // Quick fill demo credentials (for development)
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        document.getElementById('username').value = 'chronocoder';
        document.getElementById('password').value = 'talber1726';
        document.getElementById('password').focus();
      }
    });
  </script>
</body>
</html>`;

  res.send(loginHtml);
}