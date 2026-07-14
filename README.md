# 🏡 AuraHomes

AuraHomes is a full-stack property rental platform inspired by modern vacation rental applications like Airbnb. Users can explore properties, create and manage listings, upload images, leave reviews, and book accommodations through an intuitive and responsive interface.

🔗 **Live Demo:** https://aurahomes.onrender.com/

📂 **GitHub Repository:** https://github.com/DipeshMittal710/AuraHomes

---

## 📖 About the Project

AuraHomes was built to gain hands-on experience in full-stack web development by creating a real-world application from scratch. The project follows the MVC architecture and focuses on authentication, authorization, CRUD operations, image management, geolocation, and scalable backend design.

---

## ✨ Features

### 🔐 Authentication & Authorization
- User Signup & Login
- Secure authentication using Passport.js
- Session management
- Protected routes
- Owner-based authorization

### 🏠 Property Listings
- Create new property listings
- Edit existing listings
- Delete listings
- View all listings
- View detailed property pages

### 📸 Image Upload
- Upload property images
- Cloud storage with Cloudinary
- Multiple image support

### 🗺️ Maps & Location
- Location geocoding using Geoapify API
- Store latitude & longitude
- Interactive property location

### ⭐ Reviews
- Add reviews
- Delete reviews
- Ratings system

### 📅 Booking
- Book available properties
- Booking management

### 🔍 Search & Filter
- Search listings
- Category-wise filtering
- Optimized search experience

### ✅ Validation
- Joi validation
- Server-side validation
- Error handling
- Flash messages

---

# 🛠 Tech Stack

## Frontend
- HTML5
- CSS3
- Bootstrap
- JavaScript
- EJS

## Backend
- Node.js
- Express.js

## Database
- MongoDB
- Mongoose

## Authentication
- Passport.js
- Express Session

## Image Storage
- Cloudinary
- Multer

## APIs
- Geoapify Geocoding API

## Deployment
- Render

---

# 📂 Project Structure

```
AuraHomes
│
├── controllers/
├── models/
├── routes/
├── views/
├── middleware.js
├── public/
├── utils/
├── cloudConfig.js
├── app.js
└── package.json
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/DipeshMittal710/AuraHomes.git
```

Move into the project

```bash
cd AuraHomes
```

Install dependencies

```bash
npm install
```

Create a `.env` file and add:

```env
ATLASDB_URL=your_mongodb_connection

SECRET=your_session_secret

CLOUD_NAME=your_cloudinary_cloud_name

CLOUD_API_KEY=your_cloudinary_api_key

CLOUD_API_SECRET=your_cloudinary_api_secret

MAP_API_KEY=your_geoapify_api_key
```

Start the application

```bash
node app.js
```

or

```bash
npm start
```

---

# 📸 Screenshots

> Add screenshots here.

### Home Page

![Home](screenshots/home.png)

### Listing Details

![Listing](screenshots/listing.png)

### Create Listing

![Create](screenshots/create.png)

### Login

![Login](screenshots/login.png)

---

# 💡 Challenges Faced

- Integrating Cloudinary for secure image uploads.
- Optimizing the search functionality.
- Managing authentication and authorization.
- Designing a scalable MVC architecture.
- Deploying and configuring the application on Render.

---

# 📚 What I Learned

- Building scalable Express applications
- MVC architecture
- RESTful routing
- Authentication & Authorization
- MongoDB data modeling
- Cloudinary integration
- Third-party API integration
- Deployment workflows
- Debugging real-world backend applications

---

# 🌱 Future Improvements

- ❤️ Wishlist / Favorites
- 💳 Online Payment Integration
- 💬 Real-time Chat
- 📍 Google Maps Integration
- 📧 Email Notifications
- 🔔 Booking Notifications
- 🗓 Availability Calendar
- 📱 Progressive Web App (PWA)
- 🌙 Dark Mode
- 🤖 AI-powered property recommendations

---

# 👨‍💻 Author

**Dipesh Mittal**

GitHub: https://github.com/DipeshMittal710

LinkedIn: *(Add your LinkedIn profile here)*

---

# ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub.

It helps others discover the project and motivates me to keep building more!

---

## License

This project is licensed under the MIT License.
