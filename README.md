# Digital Menu (منوی دیجیتال)

A digital menu application built with React, Vite, Express, and SQLite.
Includes an admin panel to manage categories, designs, and variants, with automatic translation using Google Gemini API.

## Security and Architecture
- Passwords are hashed using `bcrypt` and stored securely.
- Admin authentication is handled using `jsonwebtoken` (JWT).
- The `database.sqlite` file and `uploads/` directory are ignored in version control (`.gitignore`) to prevent sensitive data or large files from being committed.
- API endpoints are protected by rate-limiting to prevent brute force attacks.
- Soft deletes are implemented using recursive CTEs to safely deactivate nested records (categories -> designs -> variants).

## Setup
1. Clone the repository.
2. Run `npm install`.
3. Start the server using `npm run dev`.
4. The admin panel can be accessed via `/admin`. Default password is `123456`.
