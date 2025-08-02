# StartupLink - Enhanced Authentication System

A comprehensive full-stack authentication system for the StartupLink platform that connects investors with startups and businesses. This system includes advanced security features, document management, and user role-based authentication.

## 🚀 New Features

### 🔐 Enhanced Authentication System

#### **Unique ID + OTP Login System**
- **Secure Login**: Users can login using their unique ID and email, receiving a 6-digit OTP via email
- **Unique ID Generation**: Each user gets a unique identifier (format: `SL{timestamp}{random}`) upon registration
- **OTP Verification**: 10-minute expiration with 3 attempt limit for security
- **Fallback Login**: Traditional email/password login still available

#### **Role-Based Registration**
- **Startup/Business**: For entrepreneurs seeking investment
- **Investor**: For individuals wanting to invest in startups
- **Both**: For users who both create startups and invest

#### **KYC Document Management**
- **Document Upload**: Secure file upload for required KYC documents
- **Role-Specific Requirements**:
  - **Startups**: Business Registration, Pitch Deck, Passport/ID
  - **Investors**: Proof of Funds, Intent Letter, Passport/ID
  - **Both**: All documents with flexible requirements
- **Document Status Tracking**: Pending, Approved, Rejected status for each document
- **Email Confirmations**: Automatic email notifications for document uploads

#### **Enhanced User Experience**
- **Email Notifications**: Welcome emails with account details and unique ID
- **Form Validation**: Comprehensive client and server-side validation
- **Responsive Design**: Mobile-first design with modern UI components
- **Error Handling**: User-friendly error messages and validation feedback

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)

#### **Enhanced User Model** (`backend/models/User.js`)
```javascript
// New fields added:
- uniqueId: String (auto-generated unique identifier)
- businessType: String (startup/business/investor)
- businessName: String
- otp: Object (code, expiresAt, attempts)
- kycDocuments: Array (type, name, url, status)
```

#### **Authentication Routes** (`backend/routes/auth.js`)
- `POST /auth/register` - Enhanced registration with unique ID generation
- `POST /auth/login` - Traditional password-based login
- `POST /auth/login-otp` - Initiate OTP-based login
- `POST /auth/verify-otp` - Verify OTP and complete login
- `POST /auth/upload-documents` - Upload KYC documents
- `GET /auth/required-documents/:userType` - Get required documents by user type

#### **Services**
- **Email Service** (`backend/services/emailService.js`): Handles OTP and confirmation emails
- **Document Service** (`backend/services/documentService.js`): Manages file uploads and validation

### Frontend (React Native)

#### **Enhanced Auth Screen** (`src/screens/EnhancedAuthScreen.js`)
- Multi-mode authentication (login, register, OTP login, OTP verify)
- Document upload interface
- Role-based form fields
- Real-time validation

#### **Enhanced Auth Context** (`src/contexts/AuthContext.js`)
- OTP-based authentication methods
- Document upload functionality
- Enhanced error handling

#### **API Service** (`src/services/api.js`)
- New endpoints for OTP authentication
- Document upload API integration
- Enhanced error handling

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB
- React Native development environment
- SMTP server for email functionality

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/startuplink

# JWT
JWT_SECRET=your_jwt_secret_here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL
FRONTEND_URL=https://startuplink.app

# Environment
NODE_ENV=development
```

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/TejaCHINTHALA67/Compilecode1.git
cd Compilecode1
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ..
npm install
```

4. **Start the backend server**
```bash
cd backend
npm run dev
```

5. **Start the React Native app**
```bash
# In a new terminal
npm start
```

## 📱 Usage

### Registration Flow
1. User selects role (Startup/Business/Investor)
2. Fills in personal and business information
3. System generates unique ID and sends welcome email
4. User can immediately login with unique ID + OTP

### Login Flow
1. **Traditional**: Email + Password
2. **OTP-based**: Email + Unique ID → Receive OTP → Verify OTP

### Document Upload
1. User navigates to document upload section
2. Selects document type from required list
3. Uploads file (PDF, JPG, PNG up to 10MB)
4. Receives confirmation email
5. Documents reviewed by admin team

## 🔒 Security Features

- **Unique ID System**: Prevents email enumeration attacks
- **OTP Expiration**: 10-minute time limit for security
- **Attempt Limiting**: 3 failed OTP attempts before lockout
- **Document Validation**: File type and size restrictions
- **JWT Tokens**: Secure session management
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive server-side validation

## 📧 Email Templates

The system includes professionally designed email templates for:
- **Welcome Email**: Account creation confirmation with unique ID
- **OTP Email**: Secure login code delivery
- **Document Upload Confirmation**: Upload receipt and status

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
npm test
```

## 📊 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-15",
  "userType": "entrepreneur",
  "businessType": "startup",
  "businessName": "My Startup",
  "location": {
    "city": "San Francisco",
    "country": "USA"
  }
}
```

#### OTP Login
```http
POST /api/auth/login-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "uniqueId": "SL1234567890ABC"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "uniqueId": "SL1234567890ABC",
  "otp": "123456"
}
```

#### Upload Documents
```http
POST /api/auth/upload-documents
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- documents: [file1, file2, ...]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: support@startuplink.app

## 🔄 Version History

### v2.0.0 - Enhanced Authentication System
- ✅ Unique ID + OTP login system
- ✅ Role-based registration
- ✅ KYC document management
- ✅ Email service integration
- ✅ Enhanced security features
- ✅ Mobile-responsive design

### v1.0.0 - Initial Release
- ✅ Basic authentication
- ✅ User profiles
- ✅ Startup management
- ✅ Investment tracking

---

**StartupLink** - Connecting investors with the next generation of startups! 🚀
