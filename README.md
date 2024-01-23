# Attendora API

![Attendora Logo](https://dash.attendora.com/wp-content/uploads/2024/01/logo.png.webp)

## Overview

Attendora is an attendance tracking system designed to streamline and automate the process of attendance management in educational institutions. The system leverages RFID technology and facial recognition for secure and efficient student attendance recording. The API serves as the backend, handling data management, attendance tracking, and integrating with hardware components like the ESP8266 for RFID scanning.

### Key Features

- RFID-based attendance tracking
- Integration with facial recognition for enhanced security
- Real-time attendance updates
- Secure data management and API access

## Getting Started

### Prerequisites

- Node.js
- MySQL
- An ESP8266 module for RFID scanning
- Facial recognition system (integration planned)

### Installation

1. Clone the repository: 
git clone https://github.com/GameBully2K/attendora-api
2. Navigate to the project directory and install dependencies:
npm install
3. Set up your environment variables in a `.env` file. This should include your MySQL database credentials and JWT secret keys.
4. Ensure your MySQL database is running and properly configured according to the schema used by Attendora.

### Running the API

To start the API server, run:
npm start for production
npm run dev for developement


## API Endpoints

### General

- `GET /`: Health check endpoint to confirm the API is running.

### Attendance Tracking

- `POST /getstudents`: Retrieves a list of students based on the provided criteria.
- `GET /checkTime`: Returns the current time for timestamping attendance records.
- `POST /createSession`: Initiates a new attendance session.
- `POST /markAbsent`: Marks students as absent based on RFID data.
- `POST /teachersSession`: Fetches session details for a specific teacher.
- `POST /teachersSessionCount`: Retrieves the count of sessions conducted by a specific teacher.

### Authentication

Token-based authentication is implemented for secure access to endpoints.

## Hardware Integration

The API works in conjunction with ESP8266 modules for RFID scanning. The integration with a facial recognition system is planned for future updates to enhance security and prevent fraudulent attendance.

## Contributing

Contributions to Attendora are welcome. Please ensure to follow the project's coding standards and submit pull requests for any new features or bug fixes.

## License

MIT License

## Contact

Organisation: Attendora  
Email: [questions@attendora.com](mailto:questions@attendora.com)  
Project Link: [https://github.com/GameBully2K/attendora-api](https://github.com/GameBully2K/attendora-api)

## Prospective Features

### Facial Recognition Integration

In a future update, Attendora plans to integrate facial recognition technology into the attendance system. This advancement aims to enhance security measures and add an additional layer of verification to prevent fraudulent attendance activities.
