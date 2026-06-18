# AURA Backend Service

This is the production-ready MVC, Repository, and Service-layered backend for the AURA Premium Footwear platform.

## Technologies
*   **Runtime**: Node.js >= 18
*   **Web Framework**: Express.js
*   **Database**: MongoDB (Local Engine) via Mongoose ODM
*   **Security**: Helmet, CORS, Express-Rate-Limit, express-validator, JWT, bcryptjs
*   **Logging**: Winston (Access/Error File Logging) & Morgan (HTTP Middleware)

## Getting Started

### 1. Installation
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

### 2. Seeding the Database
To seed the database with initial Categories, Products, and Admin/Customer users, run:
```bash
npm run seed
```
This seeds:
*   Default user accounts:
    *   **Admin**: `admin@aura.com` / `adminpassword123`
    *   **Customer**: `customer@aura.com` / `customerpassword123`
*   Core categories (`Men`, `Women`, `Offers`, `Special Collection`)
*   Initial items catalog (Nomad, Eclipse, Horizon, Retro) with stock quantities.

### 3. Run Development Server
To launch the server in hot-reload mode:
```bash
npm run dev
```
The server will bind to `http://localhost:5000` and connect to the local MongoDB database at `mongodb://127.0.0.1:27017/aura_store`.
The server will not start if the database connection fails.
