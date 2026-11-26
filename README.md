# QuickStay: Hotel Booking Web Application

QuickStay is a full-stack hotel booking website. Guests can browse hotels, view rooms, and book them. Hotel owners can register their hotel, add rooms with photos and prices, and manage room availability.

> **Note:** All hotels, addresses, phone numbers, and prices in the sample data are fictional. Room photos are generic stock images. This project was built for learning and demonstration.

---

## Features

**For guests**
- Browse all available hotel rooms
- Search by hotel name or city
- Filter by bed type, price range, and sort order
- View room details and photos
- Book rooms for selected dates (with availability checking)
- View past and current bookings in "My Bookings"

**For hotel owners**
- Register a hotel (name, address, city, contact)
- Add rooms with room type, price per night, amenities, and photos
- Turn room availability on or off
- View a dashboard of bookings and revenue

**For the system**
- Sign-up and sign-in handled by Clerk
- Automatic user creation in the database through a Clerk webhook
- Role-based access: normal users and hotel owners see different pages
- Prices shown in Indian Rupees (Rs)

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React, Vite | User interface |
| Styling | Tailwind CSS | Layout and design |
| Routing | React Router | Page navigation |
| Backend | Node.js, Express | REST API |
| Database | MongoDB Atlas, Mongoose | Stores users, hotels, rooms, and bookings |
| Authentication | Clerk | Sign-up, sign-in, and user identity |
| Webhooks (local testing) | ngrok | Public URL that forwards to the local backend |
| Image storage | Cloudinary | Stores photos uploaded by owners |
| Payments | Stripe Checkout | Payment for bookings |

---

## Project Structure

```
QuickStay-FullStack/
├── client/                     # React frontend
│   ├── public/
│   │   └── rooms/              # Sample room photos (room1.jpg to room7.jpg)
│   ├── src/
│   │   ├── assets/             # Static data (cities, amenities) and images
│   │   ├── components/         # Reusable parts (Navbar, HotelCard, Hero, ...)
│   │   ├── context/
│   │   │   └── AppContext.jsx  # Shared state: user, owner status, currency, rooms
│   │   └── pages/
│   │       ├── AllRooms.jsx    # Hotel Rooms list page
│   │       ├── RoomDetails.jsx # Single room page
│   │       ├── MyBookings.jsx  # Guest bookings
│   │       └── hotelOwner/     # Dashboard, AddRoom, ListRoom
│   ├── .env                    # Frontend settings (never commit)
│   └── package.json
│
├── server/                     # Express backend
│   ├── controllers/            # Feature logic (rooms, bookings, users, webhooks)
│   ├── models/                 # Database schemas: User, Hotel, Room, Booking
│   ├── routes/                 # URL-to-controller mapping
│   ├── middleware/             # Login check and file upload handling
│   ├── configs/                # Database, Cloudinary, and other setup
│   ├── seed.js                 # Adds 15 sample hotels with 2 rooms each
│   ├── server.js               # Starts the server and connects to the database
│   ├── .env                    # Secret keys (never commit)
│   └── package.json
│
├── .gitignore                  # Stops .env and node_modules from being uploaded
└── README.md
```

---

## How It Works

1. A guest opens the **Hotel Rooms** page.
2. The React page calls `GET /api/rooms` on the backend.
3. The backend asks MongoDB for available rooms and fills in each room's hotel details (called *populate*).
4. Rooms whose hotel is missing are removed, so the page never breaks on bad data.
5. The backend returns JSON, and the page shows a card for each room with its photo, hotel name, city, and price.

### Sign-up flow
1. A user signs up through Clerk.
2. Clerk sends a `user.created` event to `POST /api/clerk` on our backend (through ngrok during local development).
3. The backend verifies the signature using the webhook secret and saves the user in MongoDB, using the Clerk user ID as the database ID.

### Booking flow
1. The guest selects a room and dates.
2. The server checks that the room is free for those dates.
3. The server calculates the total price (price per night × number of nights).
4. The booking is saved, and the guest is sent to Stripe Checkout to pay.
5. After payment, the booking appears in My Bookings.

---

## Database Design

| Collection | Important fields | Relationship |
|---|---|---|
| `users` | `_id` (Clerk ID), username, email, image, role | Owns hotels and makes bookings |
| `hotels` | name, address, city, contact, owner | `owner` points to a user |
| `rooms` | hotel, roomType, pricePerNight, amenities, images, isAvailable | `hotel` points to a hotel |
| `bookings` | user, room, hotel, checkInDate, checkOutDate, totalPrice, isPaid | Points to a user, room, and hotel |

Relationships are stored as IDs. `populate` replaces those IDs with the full linked data when the data is read.

---

## API Endpoints (main ones)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms` | List all available rooms with hotel details |
| POST | `/api/rooms` | Create a room for the logged-in owner's hotel (with photo upload) |
| GET | `/api/rooms/owner` | List rooms belonging to the logged-in owner's hotel |
| POST | `/api/rooms/toggle-availability` | Turn a room on or off |
| POST | `/api/clerk` | Clerk webhook that saves new and updated users |

Other routes for hotels and bookings are in the `server/routes` folder.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)
- A [Clerk](https://clerk.com/) account (free tier works)
- A [Cloudinary](https://cloudinary.com/) account (free tier works)
- A [Stripe](https://stripe.com/) account (test mode)
- [ngrok](https://ngrok.com/) (only needed to test Clerk webhooks locally)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/QuickStay.git
cd QuickStay/QuickStay-FullStack
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a file named `.env` inside the `server` folder:

```env
MONGODB_URI=your-mongodb-connection-string
CLERK_WEBHOOK_SECRET=your-clerk-webhook-signing-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
```

> Use the exact variable names from your own working `.env` file. The names above are the standard ones for these services.

### 3. Set up the frontend

```bash
cd ../client
npm install
```

Create a file named `.env` inside the `client` folder:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_CURRENCY=Rs
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

### 4. Add sample hotels (optional but recommended)

A hotel owner account must exist first. Sign up on the website, register a hotel, then run:

```bash
cd ../server
node seed.js
```

This adds 15 sample hotels across Mumbai, New Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Jaipur, Goa, Udaipur, and Shimla, with 2 rooms each.

### 5. Run the project

Open two terminals.

**Terminal 1 (backend):**
```bash
cd server
npm run server
```
Wait for `Database Connected` and `Server running on port 3000`.

**Terminal 2 (frontend):**
```bash
cd client
npm run dev
```
Open **http://localhost:5173** in your browser.

### 6. Connect Clerk webhooks (for new user sign-ups)

1. Start ngrok: `ngrok http 3000`
2. Copy the forwarding URL it shows (for example `https://abc123.ngrok-free.dev`).
3. In the Clerk dashboard, go to **Webhooks > Add Endpoint**.
4. Set the URL to `https://YOUR-NGROK-URL/api/clerk`.
5. Subscribe to `user.created`, `user.updated`, and `user.deleted`.
6. Copy the signing secret (starts with `whsec_`) into `CLERK_WEBHOOK_SECRET` in `server/.env`.

> The free ngrok URL changes each time ngrok restarts, so update the Clerk endpoint URL after each restart.

---

## Usage

- **Guest:** Sign up, browse rooms on the Hotel Rooms page, open a room, and book it.
- **Hotel owner:** Sign up, click **Dashboard**, register your hotel, then add rooms with photos and prices from the owner pages.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `querySrv ECONNREFUSED` or `ENOTFOUND` | Your network blocks MongoDB's DNS lookup. Add `dns.setServers(["8.8.8.8", "1.1.1.1"]);` at the top of `server.js`. |
| `Authentication failed` | Check the database username and password. Special characters in passwords must be URL-encoded (for example `@` becomes `%40`). |
| `Network error` on the rooms page | The backend is not running. Start it with `npm run server`. |
| Room page is white or crashes | A room points to a hotel that no longer exists. Remove that room in MongoDB Atlas. |
| Images do not show | Check that the files are in `client/public/rooms` and named `room1.jpg` to `room7.jpg`. |
| Clerk webhook returns 400 | The `CLERK_WEBHOOK_SECRET` is wrong, or the server was not restarted after editing `.env`. |

---

## Security Notes

- `.env` files contain secret keys and are excluded from Git through `.gitignore`.
- Never paste keys, passwords, or tokens into screenshots, chat, or public issues.
- Use `.env.example` files (with placeholder values) to show other developers which variables are needed.

---

## Limitations and Future Work

- Sample hotels, prices, and photos are for demonstration only.
- Runs locally. Deployment to a public host is not yet set up.
- Clerk and Stripe are configured in development/test mode.
- Possible improvements: real hotel data, an admin panel, stronger input validation, a Stripe webhook to confirm payments automatically, pagination for large room lists, and error pages.

---

## Author

Aastha Sharma

College project: Graphic Era Deemed To Be University

---

## License

This project is for educational purposes. Add a license here if you plan to share it publicly.
