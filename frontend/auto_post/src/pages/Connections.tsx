import { useEffect, useState } from 'react';
import { socialAccountsAPI } from '../services/api';
import { Link2, CheckCircle, XCircle, Loader2, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

interface ConnectionStatus {
  platform: string;
  is_connected: boolean;
  is_active: boolean;
  platform_username: string | null;
  connected_at: string | null;
}

export const Connections = () => {
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const data = await socialAccountsAPI.getStatus();
      setConnections(data);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    try {
      const data = await socialAccountsAPI.connect(platform);
      // Open OAuth URL in new window
      if (data.auth_url) {
        window.open(data.auth_url, 'oauth', 'width=600,height=700');
        // Poll for connection status (in production, use WebSocket or callback)
        setTimeout(() => {
          fetchConnections();
          setConnecting(null);
        }, 3000);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to initiate connection');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect your ${platform} account?`)) {
      return;
    }

    try {
      // Find the account ID for this platform
      const accounts = await socialAccountsAPI.getAll();
      const account = Array.isArray(accounts) 
        ? accounts.find((acc: any) => acc.platform === platform)
        : accounts.results?.find((acc: any) => acc.platform === platform);
      
      if (account) {
        await socialAccountsAPI.disconnect(account.id);
        fetchConnections();
      }
    } catch (error) {
      alert('Failed to disconnect account');
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, any> = {
      twitter: Twitter,
      instagram: Instagram,
      linkedin: Linkedin,
      youtube: Youtube,
    };
    return icons[platform.toLowerCase()] || Link2;
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: 'bg-blue-400',
      instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
      linkedin: 'bg-blue-700',
      youtube: 'bg-red-600',
    };
    return colors[platform.toLowerCase()] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social Media Connections</h1>
        <p className="mt-1 text-sm text-gray-500">Connect your social media accounts to enable post automation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(connections).map(([platform, status]) => {
          const Icon = getPlatformIcon(platform);
          const isConnecting = connecting === platform;

          return (
            <div key={platform} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getPlatformColor(platform)} text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">{status.platform}</h3>
                    {status.platform_username && (
                      <p className="text-sm text-gray-500">@{status.platform_username}</p>
                    )}
                    {status.connected_at && (
                      <p className="text-xs text-gray-400">
                        Connected {new Date(status.connected_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {status.is_connected ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <button
                        onClick={() => handleDisconnect(platform)}
                        className="btn-secondary text-sm"
                        disabled={isConnecting}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <button
                        onClick={() => handleConnect(platform)}
                        className="btn-primary text-sm flex items-center"
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4 mr-2" />
                            Connect
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {!status.is_connected && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Connect your {status.platform} account to schedule and automate posts.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Click "Connect" for the platform you want to use</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>Authorize the app in the popup window</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>Your account will be connected and ready for automation</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>You can now schedule posts to that platform</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

