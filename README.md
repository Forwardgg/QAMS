# QAMS — Question Authoring and Moderation System

QAMS (Question Authoring and Moderation System) is a web-based platform for creating, reviewing, moderating, and managing academic question papers in a structured and standardized way.

The system supports role-based workflows for question authoring, moderation, approval, and PDF generation, ensuring transparency and consistency in assessment preparation.

---

## Live Demo

Frontend:
https://qams-front.netlify.app/

---

## Features

### Role-Based Access Control (RBAC)
The system supports three user roles:
- Administrator
- Instructor
- Moderator

Each role has controlled access to specific modules.

---

### Administrator Features
- Manage users and roles
- Configure courses and Course Outcomes (COs)
- Manage moderation records
- View reports and archived papers

---

### Instructor Features
- Create MCQ and subjective questions
- Map questions to Course Outcomes
- Assign Bloom’s Taxonomy levels
- Create and submit question papers
- Preview question papers
- View moderation feedback

---

### Moderator Features
- Review submitted question papers
- Provide comments and feedback
- Approve or request changes
- Generate moderation reports

---

### System Features
- Rich-text question editor (CKEditor)
- PDF generation of question papers
- Moderation workflow with logs
- Course Outcome mapping
- Bloom’s Taxonomy classification
- Media upload support
- Question paper archival
- Basic CO-based analytics

---

## System Architecture

The application follows a layered architecture:

Frontend:
React.js user interface

Backend:
Node.js with Express.js REST API

Database:
PostgreSQL

Authentication:
JWT-based authentication

PDF Generation:
pdf-lib / Puppeteer

---

## Technology Stack

Frontend:
- React
- Material UI
- CKEditor
- Axios

Backend:
- Node.js
- Express.js
- JWT Authentication
- Multer
- Joi validation

Database:
- PostgreSQL

Other Tools:
- Puppeteer
- pdf-lib
- Sharp
- Nodemailer
- Jest

---

## Installation

### Clone the repository

```bash
git clone <repository-url>
cd qams
```

---

### Backend setup

```bash
cd backend
npm install
```

Create `.env` file:

```
PORT=5000
DATABASE_URL=your_postgres_connection
JWT_SECRET=your_secret
```

Run backend:

```bash
npm run dev
```

---

### Frontend setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on:
http://localhost:3000

Backend runs on:
http://localhost:5000

---

## Testing

Backend tests:

```bash
npm test
```

---

## Future Enhancements

- Multi-CO mapping per question
- Advanced Bloom’s taxonomy analytics
- Integration with external academic systems
- Automated moderation suggestions
- Enhanced reporting dashboard

---

## License

This project is intended for educational and demonstration purposes.
