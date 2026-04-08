# MediConnect Backend

Backend API server for MediConnect application using Node.js, Express, and Supabase.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
Create a `.env` file with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=5000
```

3. Start the server:

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Sign in with email/mobile and password
- `POST /api/auth/signout` - Sign out current user
- `GET /api/auth/me` - Get current authenticated user

### Patients (`/api/patients`)
- `GET /api/patients/:userId` - Get patient profile
- `PUT /api/patients/:userId` - Update patient profile

### Doctors (`/api/doctors`)
- `GET /api/doctors/:userId` - Get doctor profile
- `GET /api/doctors/:userId/documents` - Get doctor documents
- `POST /api/doctors/:userId/documents` - Upload doctor documents
- `PUT /api/doctors/:userId` - Update doctor profile
- `PUT /api/doctors/:userId/approve` - Approve doctor (admin only)

### Health Check
- `GET /api/health` - Server health check

## Project Structure

```
backend/
├── config/
│   └── supabase.js       # Supabase client configuration
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── patients.js       # Patient routes
│   └── doctors.js        # Doctor routes
├── services/
│   ├── authService.js    # Authentication business logic
│   └── fileService.js    # File upload/management
├── server.js             # Express app entry point
├── package.json
└── .env                  # Environment variables

## Testing

Test the server:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "MediConnect API is running"
}
```
