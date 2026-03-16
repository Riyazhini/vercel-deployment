import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Shield, User, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const { user, login, mockLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('demo'); // 'demo' | 'credentials'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/' : '/billing');
    }
  }, [user, navigate]);

  const handleMockLogin = (role) => {
    mockLogin(role);
    navigate(role === 'admin' ? '/' : '/billing');
  };

  const handleRealLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const userData = await login(email, password);
      navigate(userData.role === 'admin' ? '/' : '/billing');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-bg p-4 flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-theme-primary p-3 rounded-xl shadow-lg">
          <Car className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lumo Industries</h1>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 ring-1 ring-gray-900/5">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-2">Motor Billing System</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setMode('demo')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${mode === 'demo' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Quick Access
          </button>
          <button
            onClick={() => setMode('credentials')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${mode === 'credentials' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Login with Account
          </button>
        </div>

        {mode === 'demo' ? (
          <div className="space-y-4">
            <button
              onClick={() => handleMockLogin('admin')}
              className="w-full flex items-center justify-center gap-3 bg-theme-secondary text-white py-4 px-4 rounded-xl font-semibold hover:bg-theme-hover transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-lg"
            >
              <Shield className="h-5 w-5" />
              Login as Admin
              <span className="text-xs font-normal text-indigo-100 ml-auto bg-black/20 px-2 py-1 rounded-md">Full Access</span>
            </button>
            
            <button
              onClick={() => handleMockLogin('staff')}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border-2 border-gray-200 py-4 px-4 rounded-xl font-semibold hover:border-theme-primary hover:bg-theme-bg transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <User className="h-5 w-5 text-gray-500" />
              Login as Staff
              <span className="text-xs font-normal text-gray-500 ml-auto bg-gray-100 px-2 py-1 rounded-md">Billing Only</span>
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">Quick access mode for demonstration</p>
          </div>
        ) : (
          <form onSubmit={handleRealLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent text-sm"
                  placeholder="admin@lumo.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-theme-secondary text-white py-3 px-4 rounded-xl font-semibold hover:bg-theme-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
