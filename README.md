# StartupLink - Mobile Startup Investment Platform

StartupLink is a mobile-first platform where entrepreneurs can pitch their startup ideas and everyday people can make micro-investments to support promising ventures. Think Instagram for startup pitches with direct investment capabilities.

## 🚀 Features

### For Entrepreneurs
- Create comprehensive startup profiles with pitch videos and documents
- Track funding progress and investor engagement
- Post updates and milestones to keep investors informed
- Analytics dashboard for profile views and funding metrics
- Community support based on startup domain

### For Investors
- Browse startup pitches by sector, location, and stage
- Make micro-investments starting from $100
- Portfolio tracking and performance analytics
- Sector-based investment recommendations
- Community features for networking and learning

### Core Features
- **Instagram-like Feed**: Vertical scroll through startup pitches
- **Multi-Payment Support**: UPI (India), Stripe (Global), Plaid (US)
- **Real-time Updates**: Socket.io for live notifications
- **🤖 AI-Powered Matching**: Intelligent startup-investor recommendations
- **Smart Investment Suggestions**: AI analyzes risk, capacity, and preferences
- **Personalized Discovery**: Machine learning algorithms for perfect matches
- **Social Features**: Like, comment, bookmark, and share startups
- **Community Groups**: Sector-based discussions and networking

## 🛠 Tech Stack

### Frontend (Mobile)
- React Native 0.72+
- React Navigation 6
- React Native Paper (Material Design)
- React Native Vector Icons
- React Native Linear Gradient
- Axios for API calls
- AsyncStorage for local data

### Backend (API)
- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time features
- Cloudinary for file uploads
- Redis for caching (optional)

### Payment Integration
- **Razorpay**: UPI and Indian payment methods
- **Stripe**: Global credit/debit cards
- **Plaid**: US bank account linking

### Infrastructure
- MongoDB Atlas (Database)
- Cloudinary (File Storage)
- Firebase (Push Notifications)
- Socket.io (Real-time Updates)

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or Atlas)
- React Native development environment
- Android Studio / Xcode for mobile development

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd startuplink
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or configure MongoDB Atlas connection in .env
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   # Server will start on http://localhost:3000
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   # From project root
   npm install
   ```

2. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Start Metro bundler**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

## 🔧 Configuration

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

- **Database**: MongoDB connection string
- **JWT**: Secret key for authentication
- **Cloudinary**: File upload service credentials
- **Payment Gateways**: Razorpay, Stripe, Plaid API keys
- **Firebase**: Push notification credentials

### Payment Gateway Setup

1. **Razorpay** (India/UPI)
   - Sign up at razorpay.com
   - Get API keys from dashboard
   - Configure webhook endpoints

2. **Stripe** (Global)
   - Create account at stripe.com
   - Get API keys
   - Set up webhook endpoints

3. **Plaid** (US Banking)
   - Register at plaid.com
   - Get client ID and secret
   - Configure for sandbox/production

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Main app screens
├── contexts/           # React contexts (Auth, etc.)
├── services/           # API services and utilities
├── styles/             # Themes and styling
└── utils/              # Helper functions

backend/
├── models/             # Database models
├── routes/             # API route handlers
├── middleware/         # Custom middleware
└── services/           # Business logic services
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- KYC verification for investors

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Startups
- `GET /api/startups` - List startups with filters
- `POST /api/startups` - Create startup
- `GET /api/startups/:id` - Get startup details
- `POST /api/startups/:id/like` - Like/unlike startup
- `POST /api/startups/:id/bookmark` - Bookmark startup

### Investments
- `POST /api/investments` - Create investment
- `GET /api/investments/portfolio` - Get user portfolio

### Payments
- `POST /api/payments/razorpay/create-order` - Create Razorpay order
- `POST /api/payments/stripe/create-intent` - Create Stripe payment intent
- `POST /api/payments/verify` - Verify payment

### AI Recommendations
- `GET /api/recommendations/startups` - Get AI-powered startup recommendations for investors
- `GET /api/recommendations/investors/:startupId` - Get investor recommendations for startups
- `GET /api/recommendations/trending-sectors` - Get trending sectors with AI insights
- `PUT /api/recommendations/preferences` - Update investor preferences for better recommendations
- `GET /api/recommendations/insights/startup/:id` - Get detailed AI insights for a startup
- `POST /api/recommendations/suggest-investment` - Generate AI-powered investment suggestions
- `POST /api/recommendations/update-scores` - Batch update AI scores (admin/cron)

## 🚀 Deployment

### Backend Deployment
1. Deploy to platforms like Railway, Render, or AWS
2. Configure environment variables
3. Set up MongoDB Atlas
4. Configure Cloudinary for file uploads

### Mobile App Deployment
1. Build release APK/IPA
2. Test on physical devices
3. Submit to Google Play Store / App Store
4. Configure deep linking and notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@startuplink.com or join our community Discord.

## 🤖 AI Features

### Intelligent Startup-Investor Matching
- **Multi-factor Scoring**: Evaluates startups based on team, market, traction, financials, and product
- **Personalized Recommendations**: AI analyzes investor preferences, risk tolerance, and investment history
- **Smart Investment Suggestions**: Recommends optimal investment amounts based on portfolio and risk profile
- **Real-time Insights**: Generates reasons why specific startups match investor criteria
- **Trending Analysis**: Identifies hot sectors and emerging opportunities

### AI Scoring Algorithm
The AI system evaluates startups using weighted criteria:
- **Sector Preference (25%)**: Matches investor's preferred industries
- **Stage Compatibility (20%)**: Aligns with investor's risk tolerance
- **Funding Range (20%)**: Fits within investor's capacity
- **Past Performance (15%)**: Analyzes founder experience and metrics
- **Location Preference (15%)**: Geographic and timezone compatibility
- **Social Proof (5%)**: Community engagement and validation

### For Investors
- Get personalized startup recommendations with AI match scores
- Receive investment amount suggestions based on risk profile
- Access detailed AI insights explaining why startups match your criteria
- View trending sectors with funding data and growth metrics
- Update preferences to improve AI recommendations

### For Entrepreneurs
- Discover investors who are likely to be interested in your sector
- Get matched with investors based on funding stage and location
- Receive AI insights on your startup's strengths and areas for improvement
- Access recommendations on how to improve your pitch appeal

## 🗺 Roadmap

- [x] ✅ AI-powered startup-investor matching system
- [x] ✅ Intelligent investment amount suggestions
- [x] ✅ Personalized recommendation algorithms
- [ ] Video pitch recording and streaming
- [ ] Multi-language support
- [ ] Web application version
- [ ] Advanced predictive analytics
- [ ] Integration with external data sources
- [ ] Automated KYC verification
- [ ] Social trading features
- [ ] AI chatbot for investment guidance

## 🏆 MVP Status

This is an MVP (Minimum Viable Product) implementation including:
- ✅ User authentication and profiles
- ✅ Startup pitch creation and browsing
- ✅ Instagram-like feed interface
- ✅ Basic investment functionality
- ✅ Payment gateway integration
- ✅ Real-time updates
- ✅ Mobile-responsive design

**Next Phase**: Advanced features, AI recommendations, and community features.
