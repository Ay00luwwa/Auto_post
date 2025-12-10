import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { Calendar, CheckCircle, XCircle, Clock, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  total: number;
  pending: number;
  posted: number;
  failed: number;
  cancelled: number;
  by_platform: Record<string, number>;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, postsData] = await Promise.all([
          postsAPI.getStats(),
          postsAPI.getAll({ ordering: '-scheduled_time' }),
        ]);
        setStats(statsData);
        setRecentPosts(Array.isArray(postsData) ? postsData.slice(0, 5) : postsData.results?.slice(0, 5) || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: 'text-pink-600',
      twitter: 'text-blue-400',
      linkedin: 'text-blue-700',
      youtube: 'text-red-600',
    };
    return colors[platform] || 'text-gray-600';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of your scheduled posts</p>
        </div>
        <Link to="/posts/new" className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          New Post
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Posts</p>
              <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold mt-1">{stats?.pending || 0}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Posted</p>
              <p className="text-3xl font-bold mt-1">{stats?.posted || 0}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Failed</p>
              <p className="text-3xl font-bold mt-1">{stats?.failed || 0}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      {stats && Object.keys(stats.by_platform).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Posts by Platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.by_platform).map(([platform, count]) => (
              <div key={platform} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 mt-1 capitalize">{platform}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Posts</h2>
          <Link to="/posts" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all →
          </Link>
        </div>
        {recentPosts.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No posts yet. Create your first post!</p>
            <Link to="/posts/new" className="btn-primary mt-4 inline-flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg font-semibold capitalize ${getPlatformIcon(post.platform)}`}>
                      {post.platform}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Scheduled: {format(new Date(post.scheduled_time), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

