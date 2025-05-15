# McDonald's Offer Generator API

Backend API for the McDonald's Offer Generator application, providing RESTful endpoints to interact with the Firebase database.

## Overview

This API serves as the backend for the McDonald's Offer Generator application, handling authentication, offer management, customer segmentation, and analytics tracking.

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **Firebase Admin SDK**: For secure interaction with Firebase services
- **Firebase Authentication**: User authentication and authorization
- **Cloud Firestore**: NoSQL database for storing application data

## API Endpoints

### Authentication

The API uses Firebase Authentication tokens for securing endpoints. Include the token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

### Offers

- `GET /api/offers` - Get all offers
- `GET /api/offers/:id` - Get an offer by ID
- `POST /api/offers` - Create a new offer
- `PUT /api/offers/:id` - Update an existing offer
- `DELETE /api/offers/:id` - Delete an offer
- `POST /api/offers/check-conflicts` - Check for conflicting offers

### Segments

- `GET /api/segments` - Get all customer segments
- `GET /api/segments/:id` - Get a segment by ID
- `POST /api/segments` - Create a new segment
- `PUT /api/segments/:id` - Update an existing segment
- `DELETE /api/segments/:id` - Delete a segment

### Products

- `GET /api/products` - Get all products (menu items)
- `GET /api/products/:id` - Get a product by ID
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update an existing product
- `DELETE /api/products/:id` - Delete a product

### Analytics

- `GET /api/analytics` - Get analytics for all offers
- `GET /api/analytics/offer/:id` - Get analytics for a specific offer
- `POST /api/analytics/offer/:id` - Update analytics for an offer

## Getting Started

### Prerequisites

- Node.js 14+ installed
- Firebase project with Firestore enabled
- Firebase service account credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your Firebase configuration
4. Start the development server:
   ```
   npm run dev
   ```

### Deployment

The API can be deployed using Docker:

```
docker build -t mcdonalds-api .
docker run -p 5000:5000 mcdonalds-api
```

## Authentication and Authorization

The API implements role-based access control:

- **Admin**: Full access to all endpoints
- **Marketer**: Can create and manage offers and segments
- **Viewer**: Read-only access to data
