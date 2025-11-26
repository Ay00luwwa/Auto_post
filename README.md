# Post Automation API

A Django REST API for scheduling and managing social media posts across multiple platforms (Instagram, Twitter, LinkedIn, YouTube).

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 📅 **Post Scheduling** - Schedule posts for future publication
- 🔍 **Filtering & Search** - Filter posts by platform, status, and search content
- 📊 **Statistics** - Get insights on your posts
- 🚫 **Post Management** - Cancel or edit pending posts
- 📚 **API Documentation** - Interactive Swagger/OpenAPI documentation
- 🔄 **Celery Integration** - Asynchronous task processing with Redis

## Tech Stack

- **Backend**: Django 5.2.7, Django REST Framework
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Task Queue**: Celery with Redis
- **Database**: SQLite (default, easily configurable for PostgreSQL)
- **API Docs**: drf-yasg (Swagger/OpenAPI)

## Prerequisites

- Python 3.8+
- Redis (for Celery)
- pip

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Auto_post
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   cd backend/postAutomation_backend
   pip install -r ../../requirements.txt
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the project root (or use defaults):
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CELERY_BROKER_URL=redis://localhost:6379/0
   CELERY_RESULT_BACKEND=redis://localhost:6379/0
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start Redis** (required for Celery)
   ```bash
   redis-server
   ```

8. **Start Celery worker** (in a separate terminal)
   ```bash
   cd backend/postAutomation_backend
   celery -A core worker --loglevel=info
   ```

9. **Start the development server**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register a new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update user profile

### Posts
- `GET /api/posts/` - List all posts (filtered by user)
- `POST /api/posts/` - Create a new post
- `GET /api/posts/{id}/` - Get post details
- `PUT /api/posts/{id}/` - Update a post
- `PATCH /api/posts/{id}/` - Partially update a post
- `DELETE /api/posts/{id}/` - Delete a post
- `POST /api/posts/{id}/cancel/` - Cancel a scheduled post
- `GET /api/posts/stats/` - Get post statistics

### Query Parameters
- `?platform=instagram` - Filter by platform
- `?status=pending` - Filter by status
- `?search=keyword` - Search in content
- `?ordering=-scheduled_time` - Order by field
- `?page=1` - Pagination

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

## Example Usage

### Register a User
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123",
    "password2": "securepassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepassword123"
  }'
```

### Create a Post
```bash
curl -X POST http://localhost:8000/api/posts/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "content": "Hello, world!",
    "scheduled_time": "2024-12-31T12:00:00Z"
  }'
```

### Get Post Statistics
```bash
curl -X GET http://localhost:8000/api/posts/stats/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
Auto_post/
├── backend/
│   └── postAutomation_backend/
│       ├── core/           # Django project settings
│       ├── posts/          # Posts app
│       ├── users/          # Users app
│       └── manage.py
├── frontend/               # Frontend (to be implemented)
├── requirements.txt
└── README.md
```

## Development

### Running Tests
```bash
python manage.py test
```

### Making Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

## Future Enhancements

- [ ] Frontend application (React/Vue)
- [ ] Actual platform API integrations
- [ ] Media file upload handling
- [ ] Post templates
- [ ] Recurring posts
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Docker configuration
- [ ] CI/CD pipeline

## Development Roadmap

### Immediate Actions (Do These First)

#### 1. Run Database Migrations
```bash
cd backend/postAutomation_backend
python manage.py makemigrations
python manage.py migrate
```

#### 2. Install Dependencies
```bash
pip install -r ../../requirements.txt
```

#### 3. Test the API
1. Start Redis: `redis-server`
2. Start Celery worker: `celery -A core worker --loglevel=info`
3. Start Django server: `python manage.py runserver`
4. Visit Swagger docs: http://localhost:8000/swagger/

#### 4. Create a Test User
```bash
python manage.py createsuperuser
# OR use the registration endpoint
```

---

### Short-Term Improvements (Next 1-2 Weeks)

#### Priority 1: Task Management & Error Handling
- [ ] Improve Celery task error handling
- [ ] Add retry logic for failed posts
- [ ] Store task IDs to allow cancellation
- [ ] Add proper logging

#### Priority 2: Testing
- [ ] Write unit tests for models
- [ ] Write API endpoint tests
- [ ] Write Celery task tests

#### Priority 3: Media Handling
- [ ] Add file upload support for images/videos
- [ ] Integrate with cloud storage (AWS S3, Cloudinary)
- [ ] Add media validation

---

### Medium-Term Features (Next 1-2 Months)

#### Frontend Development
- [ ] Choose framework (React/Next.js/Vue)
- [ ] Authentication UI
- [ ] Post creation/scheduling interface
- [ ] Post management dashboard
- [ ] Calendar view for scheduled posts
- [ ] Analytics dashboard

#### Platform Integrations
- [ ] Twitter/X API integration
- [ ] LinkedIn API integration
- [ ] Instagram API integration
- [ ] YouTube API integration
- [ ] OAuth flow for each platform

#### Enhanced Features
- [ ] Post templates
- [ ] Bulk post operations
- [ ] Recurring posts
- [ ] Post preview
- [ ] Content suggestions

---

### Long-Term Enhancements (3+ Months)

#### Advanced Features
- [ ] Analytics & insights
- [ ] A/B testing for posts
- [ ] Best time to post recommendations
- [ ] Content calendar
- [ ] Team collaboration
- [ ] Multi-account support per platform

#### Infrastructure
- [ ] Docker & Docker Compose
- [ ] CI/CD pipeline
- [ ] Production deployment guide
- [ ] Monitoring & alerting
- [ ] Database migration to PostgreSQL
- [ ] Caching with Redis

#### Business Features
- [ ] Email notifications
- [ ] Webhook support
- [ ] API rate limiting
- [ ] Subscription plans
- [ ] Usage analytics

---


## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

