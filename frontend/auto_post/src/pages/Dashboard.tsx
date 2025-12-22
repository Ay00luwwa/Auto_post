import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { Calendar, CheckCircle, XCircle, Clock, Plus, TrendingUp, Sparkles, Zap, Rocket } from 'lucide-react';
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
        return 'bg-green-100 dark:bg-gradient-to-r dark:from-green-500/20 dark:to-emerald-500/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30';
      case 'pending':
        return 'bg-yellow-100 dark:bg-gradient-to-r dark:from-yellow-500/20 dark:to-amber-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30';
      case 'failed':
        return 'bg-red-100 dark:bg-gradient-to-r dark:from-red-500/20 dark:to-rose-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30';
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700/50';
      default:
        return 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700/50';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: 'text-pink-600 dark:text-pink-400',
      twitter: 'text-blue-600 dark:text-cyan-400',
      linkedin: 'text-blue-700 dark:text-blue-400',
      youtube: 'text-red-600 dark:text-red-400',
    };
    return colors[platform] || 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 dark:border-gray-700 border-t-primary-600 dark:border-t-cyan-500"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-primary-500 dark:border-r-blue-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-primary-500 dark:text-cyan-400" />
            Overview of your automated social media posts
          </p>
        </div>
        <Link 
          to="/posts/new" 
          className="group relative px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-cyan-500 dark:to-blue-600 rounded-xl text-white font-semibold flex items-center shadow-lg shadow-primary-500/30 dark:shadow-cyan-500/30 hover:shadow-xl hover:shadow-primary-500/40 dark:hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Post
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400 to-primary-500 dark:from-cyan-400 dark:to-blue-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10"></div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl bg-blue-50 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:via-blue-500/20 dark:to-purple-500/20 backdrop-blur-xl border border-blue-200 dark:border-cyan-500/30 p-6 hover:border-blue-300 dark:hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-cyan-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 dark:from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-cyan-300/80 text-sm font-medium mb-2">Total Posts</p>
              <p className="text-4xl font-bold text-blue-900 dark:text-white">{stats?.total || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-cyan-500/20 backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-cyan-400" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500 dark:from-cyan-400 dark:to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-yellow-50 dark:bg-gradient-to-br dark:from-yellow-500/20 dark:via-amber-500/20 dark:to-orange-500/20 backdrop-blur-xl border border-yellow-200 dark:border-yellow-500/30 p-6 hover:border-yellow-300 dark:hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/50 dark:from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-yellow-700 dark:text-yellow-300/80 text-sm font-medium mb-2">Pending</p>
              <p className="text-4xl font-bold text-yellow-900 dark:text-white">{stats?.pending || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-500/20 backdrop-blur-sm">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-green-50 dark:bg-gradient-to-br dark:from-green-500/20 dark:via-emerald-500/20 dark:to-teal-500/20 backdrop-blur-xl border border-green-200 dark:border-green-500/30 p-6 hover:border-green-300 dark:hover:border-green-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 dark:from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-green-700 dark:text-green-300/80 text-sm font-medium mb-2">Posted</p>
              <p className="text-4xl font-bold text-green-900 dark:text-white">{stats?.posted || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-500/20 backdrop-blur-sm">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-red-50 dark:bg-gradient-to-br dark:from-red-500/20 dark:via-rose-500/20 dark:to-pink-500/20 backdrop-blur-xl border border-red-200 dark:border-red-500/30 p-6 hover:border-red-300 dark:hover:border-red-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 dark:from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-red-700 dark:text-red-300/80 text-sm font-medium mb-2">Failed</p>
              <p className="text-4xl font-bold text-red-900 dark:text-white">{stats?.failed || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20 backdrop-blur-sm">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-rose-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </div>
      </div>

      {/* Platform Stats */}
      {stats && Object.keys(stats.by_platform).length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-xl">
          <div className="flex items-center mb-6">
            <Zap className="w-6 h-6 text-primary-500 dark:text-cyan-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Posts by Platform</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.by_platform).map(([platform, count]) => (
              <div 
                key={platform} 
                className="group relative overflow-hidden text-center p-6 rounded-xl bg-gray-50 dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-cyan-500/50 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/50 dark:from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <p className="relative text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">{count}</p>
                <p className="relative text-sm text-gray-600 dark:text-gray-400 mt-2 capitalize">{platform}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Rocket className="w-6 h-6 text-primary-500 dark:text-cyan-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Posts</h2>
          </div>
          <Link 
            to="/posts" 
            className="text-sm text-primary-600 dark:text-cyan-400 hover:text-primary-700 dark:hover:text-cyan-300 font-medium flex items-center transition-colors duration-200"
          >
            View all →
          </Link>
        </div>
        {recentPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-blue-500/20 border border-primary-300 dark:border-cyan-500/30 mb-6">
              <Calendar className="w-10 h-10 text-primary-600 dark:text-cyan-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">No posts yet. Create your first post!</p>
            <Link 
              to="/posts/new" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-cyan-500 dark:to-blue-600 rounded-xl text-white font-semibold shadow-lg shadow-primary-500/30 dark:shadow-cyan-500/30 hover:shadow-xl hover:shadow-primary-500/40 dark:hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="group relative overflow-hidden flex items-center justify-between p-5 rounded-xl bg-gray-50 dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-cyan-500/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 dark:from-cyan-500/5 dark:to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`text-lg font-semibold capitalize ${getPlatformIcon(post.platform)}`}>
                      {post.platform}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
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
