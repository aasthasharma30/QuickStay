import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import Hotel from "./models/Hotel.js";
import Room from "./models/Room.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const seedHotels = [
  { name: "Sea Breeze Marine Hotel", city: "Mumbai", area: "Marine Drive", base: 4500 },
  { name: "Bandra Bay Residency", city: "Mumbai", area: "Bandra West", base: 3800 },
  { name: "Connaught Grand Hotel", city: "New Delhi", area: "Connaught Place", base: 4200 },
  { name: "Chanakya Plaza Hotel", city: "New Delhi", area: "Chanakyapuri", base: 3500 },
  { name: "Garden City Stay", city: "Bengaluru", area: "Indiranagar", base: 3000 },
  { name: "Tech Park Residency", city: "Bengaluru", area: "Whitefield", base: 2800 },
  { name: "Charminar Heritage Hotel", city: "Hyderabad", area: "Old City", base: 2600 },
  { name: "Marina Beach Hotel", city: "Chennai", area: "Besant Nagar", base: 3200 },
  { name: "Victoria Heritage Inn", city: "Kolkata", area: "Park Street", base: 2700 },
  { name: "Pink City Haveli", city: "Jaipur", area: "Johari Bazaar", base: 2500 },
  { name: "Amber Palace Hotel", city: "Jaipur", area: "Amer Road", base: 3600 },
  { name: "Palm Beach Resort", city: "Goa", area: "Calangute", base: 4800 },
  { name: "Baga Sunset Hotel", city: "Goa", area: "Baga", base: 4000 },
  { name: "Lake Pichola Palace", city: "Udaipur", area: "Lake Pichola", base: 5000 },
  { name: "Mall Road Hotel", city: "Shimla", area: "Mall Road", base: 3000 },
];

// Real hotel room photos from LoremFlickr (free, Creative Commons).
// The "lock" number keeps each photo the same on every page load.
const roomPhoto = (n) => `/rooms/room${(n % 7) + 1}.jpg`;

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to database");

  const owner = await mongoose.connection.db
    .collection("users")
    .findOne({ role: "hotelOwner" });

  if (!owner) {
    console.log("No hotel owner found. Sign up as a hotel owner on the website first.");
    process.exit(1);
  }

  // 1. Remove old copies of these seeded hotels and their rooms
  const oldHotels = await Hotel.find({ name: { $in: seedHotels.map((h) => h.name) } });
  const oldHotelIds = oldHotels.map((h) => h._id);
  await Room.deleteMany({ hotel: { $in: oldHotelIds } });
  await Hotel.deleteMany({ _id: { $in: oldHotelIds } });

  // 2. Remove rooms whose hotel no longer exists
  const existingHotelIds = new Set(
    (await Hotel.find({}, "_id")).map((h) => h._id.toString())
  );
  const allRooms = await Room.find({}, "hotel");
  const brokenRoomIds = allRooms
    .filter((r) => !r.hotel || !existingHotelIds.has(r.hotel.toString()))
    .map((r) => r._id);
  await Room.deleteMany({ _id: { $in: brokenRoomIds } });

  console.log(
    `Removed ${oldHotels.length} old seeded hotels and ${brokenRoomIds.length} broken rooms`
  );

  // 3. Add the hotels and their rooms again, with photos
  let roomCount = 0;
  for (const [i, h] of seedHotels.entries()) {
    const hotel = await Hotel.create({
      name: h.name,
      address: `${h.area}, ${h.city}`,
      city: h.city,
      contact: `+91 98000000${String(i + 1).padStart(2, "0")}`,
      owner: owner._id,
    });

    const amenities = ["Free WiFi", "Air Conditioning", "Breakfast included"];

    await Room.create([
      {
        hotel: hotel._id,
        roomType: "Standard Room",
        pricePerNight: h.base,
        amenities,
        images: [roomPhoto(i * 2)],
        isAvailable: true,
      },
      {
        hotel: hotel._id,
        roomType: "Deluxe Room",
        pricePerNight: h.base + 2000,
        amenities,
        images: [roomPhoto(i * 2 + 1)],
        isAvailable: true,
      },
    ]);

    roomCount += 2;
  }

  console.log(`Added ${seedHotels.length} hotels and ${roomCount} rooms`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});