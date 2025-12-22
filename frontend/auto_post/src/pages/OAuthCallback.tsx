import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { provider } = useParams<{ provider: 'google' | 'facebook' | 'github' }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      if (!provider || !['google', 'facebook', 'github'].includes(provider)) {
        setError('Invalid OAuth provider');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Check for tokens in URL hash (from backend redirect)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const error = hashParams.get('error') || searchParams.get('error');

      if (error) {
        setError(`OAuth error: ${error}`);
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (accessToken && refreshToken) {
        // Tokens are in the hash (from backend redirect)
        try {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
          
          // Update auth context by getting profile
          const profileResponse = await api.get('/auth/profile/');
          // Clear hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/dashboard');
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || err.message || 'Failed to get user profile';
          setError(errorMessage);
          setTimeout(() => navigate('/login'), 3000);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Fallback: if no tokens in hash, check for code (shouldn't happen with current flow)
      const code = searchParams.get('code');
      if (code) {
        setError('Unexpected OAuth flow - please try again');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      setError('No authentication data received');
      setLoading(false);
      setTimeout(() => navigate('/login'), 3000);
    };

    handleCallback();
  }, [searchParams, navigate, provider]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-md w-full card text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return null;
};

