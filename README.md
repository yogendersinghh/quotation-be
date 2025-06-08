# User Management System

A Node.js application with Express.js and MongoDB for user management with role-based access control.

## Features

- User registration (admin only)
- User login
- Role-based access control (admin and manager roles)
- JWT authentication
- User status management (active/blocked)

## Prerequisites

- Node.js
- MongoDB

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/your_database_name
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the server:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Register User (Admin only)
- **POST** `/api/users/register`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password123",
    "role": "manager",
    "userStatus": "active"
  }
  ```

### Login
- **POST** `/api/users/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Role-based access control for user registration
- User status check during login (blocked users cannot login) 