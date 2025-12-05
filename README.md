# Community Connect - MERN Stack Application

A comprehensive full-stack web application for local community initiatives and events management, built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## 🌟 Features

### Core Features
- **User Authentication & Authorization**: Secure login/register with JWT tokens, forgot password, reset password
- **Community Initiatives Management**: Create, join, and manage local community projects
- **Event Management**: Organize and attend community events
- **User Profiles**: Personal profiles with activity tracking
- **Search & Filtering**: Advanced search and filtering capabilities
- **Real-time Updates**: Dynamic content updates
- **Responsive Design**: Mobile-first responsive UI

### Advanced Features
- **Donation System**: Support initiatives with secure payment processing
- **Messaging System**: Direct communication between users
- **Notification System**: Real-time notifications for activities
- **Progress Tracking**: Visual progress indicators for initiatives
- **Social Features**: Like, comment, and share functionality
- **File Upload**: Image and document upload capabilities
- **Analytics Dashboard**: Statistics and insights for admins
- **Calendar Integration**: Event scheduling and reminders
- **Social Sharing**: Share initiatives and events on social media

### Technical Features
- **Modern UI/UX**: Beautiful, intuitive interface with animations
- **RESTful API**: Well-structured backend API with comprehensive endpoints
- **Database Design**: Optimized MongoDB schemas with relationships
- **Security**: Password hashing, JWT authentication, input validation
- **Performance**: Efficient queries, pagination, and caching
- **Scalability**: Modular architecture for easy scaling

## 🛠️ Tech Stack

### Frontend
- **React.js 18**: Modern React with hooks and functional components
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Query**: Server state management
- **Axios**: HTTP client for API calls
- **Lucide React**: Beautiful icons
- **React Hot Toast**: Toast notifications

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **express-validator**: Input validation
- **cors**: Cross-origin resource sharing
- **nodemailer**: Email functionality

## 📁 Project Structure

```
community-connect/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── layout/     # Layout components
│   │   │   └── ...         # Other components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── models/                 # MongoDB schemas
├── routes/                 # API routes
├── middleware/             # Custom middleware
├── server.js              # Express server
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd community-connect
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**
   - Copy `config.env` and update with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/community-connect
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

5. **Start the development servers**

   **Option 1: Run both servers simultaneously**
   ```bash
   npm run dev
   ```

   **Option 2: Run servers separately**
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/user` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Initiatives
- `GET /api/initiatives` - Get all initiatives
- `GET /api/initiatives/:id` - Get initiative by ID
- `POST /api/initiatives` - Create new initiative
- `PUT /api/initiatives/:id` - Update initiative
- `DELETE /api/initiatives/:id` - Delete initiative
- `POST /api/initiatives/:id/join` - Join initiative
- `POST /api/initiatives/:id/like` - Like/unlike initiative
- `POST /api/initiatives/:id/comment` - Add comment

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/attend` - Attend event
- `DELETE /api/events/:id/attend` - Remove attendance

### Donations
- `GET /api/donations` - Get all donations (admin)
- `GET /api/donations/initiative/:id` - Get donations for initiative
- `GET /api/donations/my-donations` - Get user's donations
- `POST /api/donations` - Create donation
- `PUT /api/donations/:id/status` - Update donation status
- `GET /api/donations/stats` - Get donation statistics

### Messages
- `GET /api/messages` - Get user's messages (inbox)
- `GET /api/messages/sent` - Get sent messages
- `GET /api/messages/:id` - Get specific message
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read
- `DELETE /api/messages/:id` - Delete message
- `GET /api/messages/unread/count` - Get unread count

### Notifications
- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/:id` - Get specific notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/unread/count` - Get unread count

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/initiatives` - Get user's initiatives
- `GET /api/users/:id/events` - Get user's events
- `GET /api/users/search` - Search users

## 🎨 Key Features Explained

### 1. User Authentication
- Secure JWT-based authentication
- Password hashing with bcryptjs
- Forgot password and reset functionality
- Protected routes with middleware
- User session management

### 2. Initiative Management
- Create and manage community projects
- Join initiatives as members
- Track progress and achievements
- Like and comment on initiatives
- Search and filter capabilities
- Donation support system

### 3. Event Management
- Create and organize community events
- Event registration and attendance tracking
- Date and location management
- Event categories and pricing
- Calendar integration

### 4. Donation System
- Secure payment processing
- Multiple payment methods
- Anonymous donation option
- Donation tracking and statistics
- Receipt generation

### 5. Messaging System
- Direct user-to-user messaging
- Initiative and event-related messages
- Message threading and organization
- Read/unread status tracking
- File attachments support

### 6. Notification System
- Real-time notifications
- Multiple notification types
- Priority-based notifications
- Mark as read functionality
- Notification preferences

### 7. User Profiles
- Personal profile management
- Activity tracking
- Initiative and event history
- Social connections
- Achievement badges

### 8. Modern UI/UX
- Responsive design for all devices
- Smooth animations with Framer Motion
- Intuitive navigation
- Beautiful gradients and shadows
- Loading states and error handling
- Toast notifications

## 🔧 Customization

### Styling
- Modify `client/src/index.css` for global styles
- Update `client/tailwind.config.js` for theme customization
- Use Tailwind CSS classes for component styling

### Database
- Modify schemas in `models/` directory
- Add new fields or relationships as needed
- Update API routes accordingly

### Features
- Add new models in `models/` directory
- Create corresponding routes in `routes/` directory
- Build frontend components in `client/src/components/`
- Add pages in `client/src/pages/`

## 🚀 Deployment

### Backend Deployment
1. Set up environment variables
2. Deploy to platforms like Heroku, Railway, or DigitalOcean
3. Configure MongoDB Atlas for production database

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Configure API endpoints for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@communityconnect.com or create an issue in the repository.

---

**Community Connect** - Building stronger communities through technology. 

MongoDB Connected: ...
Server running on port 5000 