# Migration Instructions

After adding the SocialAccount model, you need to create and run migrations:

```bash
cd backend/postAutomation_backend
python manage.py makemigrations
python manage.py migrate
```

This will create the `posts_socialaccount` table in your database.

