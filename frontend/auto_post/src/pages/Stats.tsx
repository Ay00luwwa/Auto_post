import { useEffect, useState } from 'react';
import { postsAPI } from '../services/api';
import { BarChart3, TrendingUp, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

interface Stats {
  total: number;
  pending: number;
  posted: number;
  failed: number;
  cancelled: number;
  by_platform: Record<string, number>;
}

export const Stats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await postsAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Failed to load statistics</p>
      </div>
    );
  }

  const successRate = stats.total > 0 ? ((stats.posted / stats.total) * 100).toFixed(1) : 0;
  const totalPlatforms = Object.keys(stats.by_platform).length;
  const maxPlatformCount = Math.max(...Object.values(stats.by_platform), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
        <p className="mt-1 text-sm text-gray-500">Analytics and insights for your posts</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Posts</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Success Rate</p>
              <p className="text-3xl font-bold mt-1">{successRate}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Failed</p>
              <p className="text-3xl font-bold mt-1">{stats.failed}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Posted</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.posted}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.posted / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.pending}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Failed</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.failed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {stats.cancelled > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Cancelled</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stats.cancelled}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-600 h-2 rounded-full transition-all"
                    style={{ width: `${stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Distribution</h2>
          {totalPlatforms === 0 ? (
            <p className="text-gray-500 text-center py-8">No posts across platforms yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.by_platform).map(([platform, count]) => {
                const percentage = maxPlatformCount > 0 ? (count / maxPlatformCount) * 100 : 0;
                const platformColors: Record<string, string> = {
                  Instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
                  Twitter: 'bg-blue-400',
                  LinkedIn: 'bg-blue-700',
                  YouTube: 'bg-red-600',
                };
                const bgColor = platformColors[platform] || 'bg-gray-500';

                return (
                  <div key={platform}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{platform}</span>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${bgColor} h-3 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

