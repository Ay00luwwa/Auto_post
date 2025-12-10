import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { Plus, Search, Filter, Edit, Trash2, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const Posts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [platformFilter, statusFilter, search]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params: any = { ordering: '-scheduled_time' };
      if (platformFilter) params.platform = platformFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const data = await postsAPI.getAll(params);
      setPosts(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this post?')) return;

    try {
      await postsAPI.cancel(id);
      fetchPosts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel post');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsAPI.delete(id);
      fetchPosts();
    } catch (error) {
      alert('Failed to delete post');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
      twitter: 'bg-blue-400',
      linkedin: 'bg-blue-700',
      youtube: 'bg-red-600',
    };
    return colors[platform] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your scheduled social media posts</p>
        </div>
        <Link to="/posts/new" className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input-field"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="youtube">YouTube</option>
          </select>

          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="posted">Posted</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {(platformFilter || statusFilter || search) && (
            <button
              onClick={() => {
                setPlatformFilter('');
                setStatusFilter('');
                setSearch('');
              }}
              className="btn-secondary flex items-center justify-center"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No posts found</p>
          <Link to="/posts/new" className="btn-primary inline-flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div key={post.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${getPlatformColor(post.platform)}`}></div>
                    <span className="text-lg font-semibold text-gray-900 capitalize">{post.platform}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>

                  {post.media_url && (
                    <a
                      href={post.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center mb-3"
                    >
                      View Media →
                    </a>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(post.scheduled_time), 'MMM dd, yyyy HH:mm')}
                    </div>
                    <div>Created: {format(new Date(post.created_at), 'MMM dd, yyyy')}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {post.can_edit && (
                    <Link
                      to={`/posts/${post.id}/edit`}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                  )}
                  {post.can_cancel && (
                    <button
                      onClick={() => handleCancel(post.id)}
                      className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

