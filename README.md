# RRRewear - Circular Fashion Swap Platform

RRRewear is a sustainable fashion platform that enables users to swap pre-owned clothing items, promoting circular fashion and reducing textile waste.

## Features

- User registration and authentication
- Clothing item listings with images and descriptions
- Swap request system
- Messaging system between users
- User ratings and reviews
- Admin panel for moderation
- Categories and tags for easy navigation
- Wishlist functionality
- Real-time notifications

## Tech Stack

- Frontend: HTML, CSS, JavaScript, PUG templating
- Backend: Node.js, Express.js
- Database: MySQL
- DevOps: Docker, Git

## Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- MySQL (if running without Docker)

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rrrewear.git
cd rrrewear
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the root directory with the following variables:
```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=rrrewear
SESSION_SECRET=your_session_secret
```

4. Start the application using Docker:
```bash
docker-compose up --build
```

Or start without Docker:
```bash
npm start
```

The application will be available at http://localhost:3000

## Development

To run the application in development mode with auto-reload:
```bash
npm run dev
```

## Project Structure

```
rrrewear/
├── app.js              # Main application file
├── package.json        # Project dependencies
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
├── public/            # Static files
│   ├── css/
│   ├── js/
│   └── images/
├── views/             # PUG templates
│   ├── layout.pug
│   ├── users/
│   ├── listings/
│   └── categories/
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 