# Gaithtours - ETG API Workflow

## Complete Booking Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────┘

Step 1: SEARCH PAGE (SearchPage.jsx)
┌────────────────────────────────────┐
│ User enters:                       │
│ • Check-in / Check-out dates       │
│ • Number of guests (adults/kids)   │
│ • Region ID OR Test Hotel          │
│ • Residency (country code)         │
└────────────────┬───────────────────┘
                 │
                 ▼
        [SEARCH HOTELS] Button Click
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ ETG API METHOD: POST /search/serp/region                   │
│                 OR /search/serp/hotels                     │
│                                                            │
│ Request Payload:                                           │
│ {                                                          │
│   region_id: 2540 (or ids: ['test_hotel_do_not_book'])   │
│   checkin: "YYYY-MM-DD",                                  │
│   checkout: "YYYY-MM-DD",                                 │
│   guests: [{adults: 2, children: []}],                    │
│   residency: "us",                                        │
│   currency: "USD"                                         │
│ }                                                          │
│                                                            │
│ Response:                                                  │
│ {                                                          │
│   hotels: [{                                              │
│     id: "hotel_id",                                       │
│     name: "Hotel Name",                                   │
│     address: "Address",                                   │
│     star_rating: 4                                        │
│   }]                                                      │
│ }                                                          │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
    Navigate to Hotel Page (/hotel/:id)
    Pass: searchParams + hotelData


═══════════════════════════════════════════════════════════════


Step 2: HOTEL PAGE (HotelPage.jsx)
┌────────────────────────────────────┐
│ Display:                           │
│ • Hotel name & address             │
│ • Available room rates             │
└────────────────┬───────────────────┘
                 │
                 ▼
    Automatically calls on page load:
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ ETG API METHOD: POST /search/hp/                          │
│                                                            │
│ Request Payload:                                           │
│ {                                                          │
│   id: "hotel_id",                                         │
│   checkin: "YYYY-MM-DD",                                  │
│   checkout: "YYYY-MM-DD",                                 │
│   guests: [{adults: 2, children: []}],                    │
│   residency: "us"                                         │
│ }                                                          │
│                                                            │
│ Response:                                                  │
│ {                                                          │
│   hotels: [{                                              │
│     id: "hotel_id",                                       │
│     name: "Hotel Name",                                   │
│     rates: [{                                             │
│       room_name: "Standard Double Room",                  │
│       meal: "breakfast",                                  │
│       payment_options: {...},                             │
│       match_hash: "m-xxxxx" (for searching)               │
│       book_hash: "h-xxxxx" (for booking)                  │
│     }]                                                    │
│   }]                                                      │
│ }                                                          │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│ User reviews rates and clicks      │
│ [BOOK NOW] button on desired rate  │
└────────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ ETG API METHOD: POST /hotel/prebook                       │
│                                                            │
│ Request Payload:                                           │
│ {                                                          │
│   hash: "h-xxxxx" (book_hash from selected rate)          │
│ }                                                          │
│                                                            │
│ Purpose: Pre-validate availability & lock rate             │
│                                                            │
│ Response:                                                  │
│ {                                                          │
│   hotels: [{                                              │
│     rates: [{                                             │
│       book_hash: "h-xxxxx" (confirmed hash for booking)   │
│       room_name: "...",                                   │
│       payment_options: {...}                              │
│     }]                                                    │
│   }]                                                      │
│ }                                                          │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
    Navigate to Booking Page (/booking)
    Pass: rate + hotel + searchParams + bookHash


═══════════════════════════════════════════════════════════════


Step 3: BOOKING PAGE (BookingPage.jsx)
┌────────────────────────────────────┐
│ User enters:                       │
│ • Guest names (first & last)       │
│ • Email address                    │
│ • Phone number                     │
└────────────────┬───────────────────┘
                 │
                 ▼
    [CONFIRM BOOKING] Button Click
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ ETG API METHOD 1: POST /hotel/order/booking/form/         │
│                                                            │
│ Request Payload:                                           │
│ {                                                          │
│   partner_order_id: "ord_1234567890",                     │
│   book_hash: "h-xxxxx",                                   │
│   language: "en",                                         │
│   user_ip: "127.0.0.1"                                    │
│ }                                                          │
│                                                            │
│ Purpose: Create booking order & get partner_order_id       │
│                                                            │
│ Response:                                                  │
│ {                                                          │
│   partner_order_id: "ord_1234567890",                     │
│   status: "created"                                       │
│ }                                                          │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ ETG API METHOD 2: POST /hotel/order/booking/finish/       │
│                                                            │
│ Request Payload:                                           │
│ {                                                          │
│   partner: {                                              │
│     partner_order_id: "ord_1234567890"                    │
│   },                                                      │
│   payment_type: {                                         │
│     type: "deposit",                                      │
│     amount: 428.00,                                       │
│     currency_code: "USD"                                  │
│   },                                                      │
│   rooms: [{                                               │
│     guests: [{                                            │
│       first_name: "John",                                 │
│       last_name: "Doe"                                    │
│     }]                                                    │
│   }],                                                     │
│   user: {                                                 │
│     email: "user@example.com",                           │
│     phone: "+1234567890",                                │
│     comment: "Test booking"                               │
│   }                                                       │
│ }                                                          │
│                                                            │
│ Purpose: Submit final booking with guest details           │
│                                                            │
│ Response:                                                  │
│ { status: "processing" }                                  │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
        POLLING LOOP (every 2 seconds)
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ ETG API METHOD 3: POST /hotel/order/booking/finish/status/│
│                                                            │
│ Request Payload:                                           │
│ {                                                          │
│   partner_order_id: "ord_1234567890"                      │
│ }                                                          │
│                                                            │
│ Purpose: Check booking confirmation status                 │
│                                                            │
│ Response Options:                                          │
│                                                            │
│ Option A - Still Processing:                              │
│ {                                                          │
│   percent: 50,                                            │
│   status: "processing"                                    │
│ }                                                          │
│ → Continue polling (max 20 attempts)                      │
│                                                            │
│ Option B - Confirmed:                                      │
│ {                                                          │
│   percent: 100,                                           │
│   status: "confirmed",                                    │
│   order_id: "ETG-ORDER-ID"                                │
│ }                                                          │
│ → Display success message ✅                              │
│                                                            │
│ Option C - Failed:                                         │
│ {                                                          │
│   percent: 0,                                             │
│   status: "failed",                                       │
│   error: "Reason..."                                      │
│ }                                                          │
│ → Display error message ❌                                │
└────────────────────────────────────────────────────────────┘
```

---

## Simplified Step-by-Step Workflow

### **1️⃣ Search Hotels**
**Your Step:** User enters search criteria (dates, guests, location)
**ETG API Method:** `POST /search/serp/region` or `POST /search/serp/hotels`
**Result:** List of available hotels

---

### **2️⃣ View Hotel Details & Rates**
**Your Step:** User selects a hotel to view available rooms
**ETG API Method:** `POST /search/hp/`
**Result:** Detailed hotel information with all available room rates

---

### **3️⃣ Pre-validate Selected Rate**
**Your Step:** User clicks "Book Now" on a specific rate
**ETG API Method:** `POST /hotel/prebook`
**Result:** Confirmed availability and validated book_hash for next step

---

### **4️⃣ Initialize Booking**
**Your Step:** System creates booking order
**ETG API Method:** `POST /hotel/order/booking/form/`
**Result:** Partner order ID for tracking

---

### **5️⃣ Submit Booking Details**
**Your Step:** User enters guest details and confirms booking
**ETG API Method:** `POST /hotel/order/booking/finish/`
**Result:** Booking submitted for processing

---

### **6️⃣ Monitor Booking Status**
**Your Step:** System polls for booking confirmation
**ETG API Method:** `POST /hotel/order/booking/finish/status/` (repeated)
**Result:** Final booking confirmation with order ID

---

## Key Data Flow

```
Search Params (dates, guests)
    ↓
Hotel List → Hotel ID
    ↓
Hotel Page → Rate (with book_hash)
    ↓
Prebook → Validated book_hash
    ↓
Create Booking → partner_order_id
    ↓
Finish Booking → Processing
    ↓
Poll Status → Confirmed ✅
```

---

## Important Notes

1. **book_hash vs match_hash:**
   - `match_hash` (starts with "m-"): Used for search/comparison
   - `book_hash` (starts with "h-"): Used for actual booking
   - Always use `book_hash` for prebook and booking steps

2. **Prebook is mandatory:**
   - Must call `/hotel/prebook` before creating a booking
   - Validates availability and locks the rate temporarily

3. **Booking requires polling:**
   - After calling `/finish/`, you must poll `/finish/status/`
   - ETG processes bookings asynchronously
   - Poll every 2 seconds until `percent: 100` or timeout

4. **All dates in ISO format:**
   - Check-in/Check-out: "YYYY-MM-DD"
   - Example: "2025-12-01"

5. **Guest structure:**
   - Must match the original search criteria
   - Each room must have all guests with first_name and last_name
