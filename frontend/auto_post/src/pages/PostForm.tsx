import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { Save, Calendar, Image, FileText } from 'lucide-react';

export const PostForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    platform: '',
    content: '',
    media_url: '',
    scheduled_time: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const fetchPost = async () => {
        try {
          const post = await postsAPI.getById(Number(id));
          setFormData({
            platform: post.platform,
            content: post.content,
            media_url: post.media_url || '',
            scheduled_time: post.scheduled_time ? new Date(post.scheduled_time).toISOString().slice(0, 16) : '',
          });
        } catch (error) {
          alert('Failed to load post');
          navigate('/posts');
        }
      };
      fetchPost();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await postsAPI.update(Number(id), formData);
      } else {
        await postsAPI.create(formData);
      }
      navigate('/posts');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData) {
        const errorMessages = Object.values(errorData).flat().join(', ');
        setError(errorMessages);
      } else {
        setError('Failed to save post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Set minimum datetime to now
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Post' : 'Create New Post'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEdit ? 'Update your scheduled post' : 'Schedule a new social media post'}
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
              Platform *
            </label>
            <select
              id="platform"
              name="platform"
              required
              className="input-field"
              value={formData.platform}
              onChange={handleChange}
              disabled={isEdit}
            >
              <option value="">Select a platform</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <textarea
                id="content"
                name="content"
                required
                rows={6}
                className="input-field pl-10 resize-none"
                placeholder="Write your post content here..."
                value={formData.content}
                onChange={handleChange}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.content.length} characters
            </p>
          </div>

          <div>
            <label htmlFor="media_url" className="block text-sm font-medium text-gray-700 mb-2">
              Media URL (Optional)
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3">
                <Image className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="media_url"
                name="media_url"
                type="url"
                className="input-field pl-10"
                placeholder="https://example.com/image.jpg"
                value={formData.media_url}
                onChange={handleChange}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter a URL to an image or video
            </p>
          </div>

          <div>
            <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Time *
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="scheduled_time"
                name="scheduled_time"
                type="datetime-local"
                required
                min={minDateTime}
                className="input-field pl-10"
                value={formData.scheduled_time}
                onChange={handleChange}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Select when you want this post to be published
            </p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/posts')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isEdit ? 'Update Post' : 'Schedule Post'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

