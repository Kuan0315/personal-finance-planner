# Personal Finance Planner

A comprehensive web-based application designed to help individuals take control of their financial health through goal tracking, investment recommendations, and market insights.

## 🎯 Project Overview

The Personal Financial Planning System empowers users to:
- Set realistic financial goals and track progress
- Receive AI-assisted savings calculations and feasibility analysis
- Get personalized investment recommendations based on risk profile
- Access real-time market insights and financial news
- Calculate investment ROI using simple and compound interest models

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19.2.4
- **Routing:** React Router DOM 7.14.1
- **Build Tool:** Vite 8.0.4
- **Charting:** Chart.js 4.5.1
- **Styling:** CSS3 with CSS Variables
- **UI Framework:** Bootstrap 5.3.3 (via CDN)
- **Icons:** Bootstrap Icons 1.11.3
- **Linting:** ESLint 9.39.4
- **Data:** Local mock data and browser storage

---

## ✨ Features

### 1. User Management
- ✅ User Registration with validation
- ✅ Secure Login/Logout
- ✅ Password Recovery using local mock responses
- ✅ Session Management
- ✅ Input Validation & Security

### 2. Profile Management
- ✅ View/Update Profile
- ✅ Change Password
- ✅ Delete Account

### 3. Financial Goal Management with AI
- ✅ Create, Update, Delete, View Goals
- ✅ Goal Progress Tracking
- ✅ Monthly Savings Calculation
- ✅ AI Feasibility Analysis
- ✅ AI Smart Recommendations
- ✅ Scenario Simulation

### 4. Investment Recommendation
- ✅ Risk Profiling (Low, Medium, High)
- ✅ Investment Plan Generation
- ✅ Financial Instrument Recommendations
- ✅ Goal-Based Matching

### 5. Market Insights Dashboard
- ✅ Mock Market Trends
- ✅ Local Summary & Indicators
- ✅ Financial News Display
- ✅ Market Data Visualization (Charts)
- ✅ Action Recommendations
- ✅ Manual Refresh & Status Display

### 6. ROI/Investment Calculator
- ✅ Investment Input Fields
- ✅ Simple & Compound Interest Calculation
- ✅ Scenario Comparison
- ✅ Result Visualization & Charts

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/Kuan0315/personal-finance-planner.git
cd personal-finance-planner
```

### Step 2: Setup Backend
```bash
cd backend
npm install

# Create .env file in backend directory
echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority" >> .env
echo "JWT_SECRET=your_jwt_secret_key" >> .env
echo "PORT=3001" >> .env
echo "FRONTEND_URL=http://localhost:5173" >> .env
echo "SMTP_EMAIL=your_test_email_for_the_system" >> .env
echo "SMTP_PASSWORD=your_smtp_password" >> .env
```

### Step 3: Setup Frontend
```bash
cd ../frontend
npm install
```

---

## 📖 How to Run

### Run Frontend Development Server
```bash
cd frontend
npm run dev
# App opens on http://localhost:5173
```

### Access the Application
Open your browser and navigate to:
```
http://localhost:5173
```

### Available Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 💻 System Requirements

### Minimum Requirements
- **Browser:** Chrome, Firefox, Edge, Safari (latest versions)
- **Memory:** 2GB RAM
- **Storage:** 500MB disk space
- **Internet:** Not required for core app flows

### Supported Devices
- Desktop computers
- Laptops
- Tablets/Mobile browsers

---

## ✅ Quality Requirements

### Security
- Session-based local authentication
- Protected frontend routes
- Input validation
- XSS-safe React rendering

### Performance
- User registration/login: < 2 seconds
- Profile operations: < 2 seconds
- Investment recommendations: < 3 seconds
- AI analysis: 3–5 seconds
- Dashboard load: < 3 seconds
- ROI calculations: < 1 second

### Reliability
- Zero-crash normal operation
- Persistent browser storage for mock users
- Consistent calculation results
- Graceful mock request handling
- Reliable password recovery

### Data Accuracy
- Mathematically accurate calculations
- Correct risk profiling
- Aligned investment recommendations
- Immediate data reflection
- Deterministic mock market data

---

## 🔐 Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
SMTP_EMAIL=sample@gmail.com
SMTP_PASSWORD="your_smtp_password"
API_KEY=your_external_api_key
```

### Frontend (.env)
No environment variables are required for the mock-data setup.

---

## 🐛 Troubleshooting

**Issue:** Port 3001/5173 already in use
```bash
# Kill the process using the port
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3001 | xargs kill -9
```

**Issue:** Need to reset the mock users
- Clear `localStorage` and `sessionStorage` in the browser
- Or remove the `finance-planner-mock-users` key from local storage

---

## 📝 License

This project is developed as part of the WIF2003 Web Programming course.
