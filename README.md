# Fullstack Challenge - User Management System

A containerized full-stack application for registering and managing users, built with **NestJS**, **Next.js 15**, and **PostgreSQL**. This project implements a Back-office User Management System with secure authentication, session management, and a responsive dashboard.

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** installed on your machine.
- (Optional) **Node.js 22+** if you wish to run tests locally outside of Docker.

### Installation & Running

This project is fully containerized. To start the entire stack (Database, Backend, and Frontend):

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/pirespaulohenrique/challenge-app.git
    cd challenge-app
    ```

2.  **Configuration & Secrets**

    If you don't provide a .env file, the database user/password defaults to admin/password.  
    **`.env`**: Contains sensitive secrets (passwords, keys). **Ignored by Git.**

    **Step 1:** Create a `.env` file in the project root.  
    **Step 2:** Copy the following content into it and adjust the passwords if necessary.

    ```bash
    # Database Credentials
    DATABASE_USER=your_db_user
    DATABASE_PASSWORD=your_db_password
    ```

3.  **Build and Run:**

    ```bash
    docker-compose up --build
    ```

4.  **Access the Application:**
    - **Frontend:** [http://localhost:3000](http://localhost:3000)
    - **Backend API:** [http://localhost:3001](http://localhost:3001)

The database will automatically initialize with the required schema on the first run.

---

## Project Architecture

The solution follows a microservices-ready structure with a clear separation of concerns:

```text
challenge-app/
├── backend/                # NestJS (Node.js 22)
│   ├── src/auth/           # Authentication Logic (Sign-in/up, Session mgmt)
│   ├── src/users/          # User Domain (CRUD, Validation, Counters)
│   ├── src/sessions/       # Session Domain (Entities)
│   └── test/               # Jest Unit Tests
├── frontend/               # Next.js 15 (React)
│   ├── src/app/            # App Router Pages (Login, Dashboard)
│   ├── src/context/        # Global State (Theme Persistence)
│   ├── src/lib/            # Utilities (Fetch Client, API helpers)
│   ├── src/__tests___/     # Jest unit tests
│   └── tests/              # Playwright E2E Tests
├── docker-compose.yml      # Orchestration
└── init.sql                # Database Initialization Script
```

## Tech Stack

Backend: NestJS, TypeORM, Node.js 22

Frontend: Next.js 15 (App Router), Material UI (MUI), TypeScript

Database: PostgreSQL 15

Testing: Jest (Unit), Playwright (E2E)

## Design & Security Decisions

1. Input Integrity: Implemented strict input validation on both the Frontend (for UX) and Backend (via DTOs and pipes) to prevent SQL injection and ensure data integrity before it reaches the Service layer.

2. Passwords: Passwords are hashed (using bcrypt) before saving. The password field is explicitly excluded (select: false) from API responses to prevent leakage.

3. Sensitive data (Database credentials) are managed via Environment Variables (.env) and Docker environment injection, ensuring the codebase contains no hardcoded secrets.

4. Data Immutability: Leveraged Database constraints/ORM decorators to strictly enforce that creation_time is immutable and update_time is automatically managed, removing the risk of human error in the business logic.

## API Endpoints

### Auth Domain

- POST /auth/register - Create a new user and session.
- POST /auth/login - Authenticate using First Name + Password.
- POST /auth/logout - Terminate the current session.

### User Domain

- GET /users?page=1 - List users (Paginated, 6 per page).
- POST /users - Create a new user (Admin).
- PUT /users/:id - Update user info (Name updates blocked for inactive users).
- DELETE /users/:id - Remove a user.

## Testing

### Backend Testing Strategy

The backend tests focus on critical business logic, API behavior, and database interactions using **Supertest** to simulate HTTP requests against the running application.

To run the tests, navigate to the `backend` directory and execute the following commands:

```bash
cd backend
npm install

# Run tests
npm run test
npm run test:e2e
```

#### Local Auth Tests

_Located in: `backend/src/auth/auth.service.spec.ts`_

#### End-to-End (API) Tests

_Located in: `backend/test/`_

These tests verify that the controllers, services, and database all work together correctly.

**_Authentication Module_**

- **`POST /auth/login`**:
  - [x] Success with valid credentials.
  - [x] Rejection for invalid passwords.
  - [x] Rejection for non-existent users.
  - [x] **Security**: Rejection for inactive users.
- **`POST /auth/register`**:
  - [x] Successful user creation.
  - [x] Validation: Rejection for short usernames or passwords.
  - [x] Uniqueness: Rejection if username is already taken.
- **`POST /auth/logout`**:
  - [x] Invalidation of the current session.

**_User Management Module_**

- **`GET /users`**:
  - [x] Default fetch (page 1).
  - [x] Pagination functionality (e.g., fetching page 2).
  - [x] Sorting by username and creation date (ASC/DESC).
- **`POST /users`**:
  - [x] Successful creation of both active and inactive users (Admin context).
- **`PUT /users/:id`**:
  - [x] Update user details (First/Last Name, Status).
  - [x] Password reset functionality.
- **`DELETE /users/:id`**:
  - [x] Successful user deletion.
  - [x] Validation: Ensures target exists.

### Frontend Testing Strategy

1.  **Ensure the application is running.** The Docker containers must be up.
2.  **Run the tests:**

    ```bash
    cd frontend

    # Install Playwright browsers (only required once)
    npx playwright install --with-deps chromium

    # Run Unit tests
    npm run test

    # Run Playwright tests
    npm run test:e2e --ui
    ```

#### 1. Unit & Integration Tests (Jest + React Testing Library)

_Located in: `frontend/src/__tests__/`_

These tests focus on **component logic**, **rendering**, and **client-side validation** without needing a running backend. We mock the API client to ensure components handle data and loading states correctly.

**Authentication Components (`AuthPage.test.tsx`)**

- [x] **Rendering:** Verifies the Login form appears by default.
- [x] **Navigation:** Tests the toggle logic between "Sign In" and "Sign Up" modes.
- [x] **Validation:** Checks error messages for empty fields or short passwords.
- [x] **Submission:** Mocks a successful login response and verifies the redirection logic.
- [x] **Error Handling:** Verifies that API errors (e.g., "Invalid credentials") are displayed to the user.

**Dashboard Components (`Dashboard.test.tsx`)**

- [x] **Initial Load:** Verifies the user list is fetched and the loading spinner appears/disappears.
- [x] **Sorting Logic:** Checks if clicking a column header triggers a data fetch with the correct `orderBy` parameters.
- [x] **Add User:** Tests opening the modal, validating inputs, and sending the correct POST request.
- [x] **Delete User:** Tests the delete confirmation dialog and ensures the correct DELETE request is sent.

#### 2. End-to-End (E2E) Tests (Playwright)

_Located in: `frontend/tests/`_

These tests simulate real user interactions in a real browser (Chromium) to validate critical user flows and routing.

**Authentication Flow (`auth.spec.ts`)**

- [x] **Sign Up:** User can register a new account and is automatically redirected to the dashboard.
- [x] **Log In:** Existing users can log in successfully.
- [x] **Session Handling:** Verifies the user is redirected to the dashboard upon success.
- [x] **Logout:** Verifies the user can log out and is returned to the login screen.
- [x] **Navigation:** Seamless toggling between Sign-in and Sign-up forms.

**Dashboard Flow (`dashboard.spec.ts`)**

- [x] **Data Visualization:** Verifies the user list and "Total Users" count renders correctly (using mocked network responses for speed).
- [x] **Interactions:** Drives the "Add User" and "Delete User" flows to ensure the UI behaves correctly in a live browser environment.
