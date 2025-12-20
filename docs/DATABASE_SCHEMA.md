# PetMedia - Firebase Firestore Database Schema

## Overview

PetMedia uses **Firebase Firestore**, a NoSQL document-oriented database. Unlike traditional SQL databases, Firestore organizes data into **Collections** (similar to tables) containing **Documents** (similar to rows) with flexible **Fields** (similar to columns).

## Database Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PETMEDIA FIRESTORE DATABASE                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     USERS       │     │      PETS       │     │    MAPSPOTS     │
│   Collection    │     │   Collection    │     │   Collection    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ • id (auto)     │     │ • id (auto)     │     │ • id (auto)     │
│ • email         │◄────┤ • ownerId ──────┤     │ • creatorId ────┼──►│
│ • displayName   │     │ • name          │     │ • name          │   │
│ • photoURL      │     │ • species       │     │ • type          │   │
│ • city          │     │ • breed         │     │ • coords        │   │
│ • bio           │     │ • photos[]      │     │ • photoURL      │   │
│ • favorites[]   │     │ • description   │     │ • note          │   │
│ • createdAt     │     │ • city          │     │ • createdAt     │   │
│ • updatedAt     │     │ • vaccinated    │     │ • updatedAt     │   │
└────────┬────────┘     │ • neutered      │     └─────────────────┘   │
         │              │ • createdAt     │                           │
         │              │ • updatedAt     │                           │
         │              └─────────────────┘                           │
         │                                                            │
         │              ┌─────────────────┐     ┌─────────────────┐   │
         │              │     CHATS       │     │    MESSAGES     │   │
         │              │   Collection    │     │   Collection    │   │
         │              ├─────────────────┤     ├─────────────────┤   │
         └──────────────┤ • id (auto)     │     │ • id (auto)     │   │
                        │ • participants[]│     │ • threadId ─────┼───┤
                        │ • user1Id ──────┼──►  │ • senderId ─────┼───┘
                        │ • user1Name     │     │ • text          │
                        │ • user1Photo    │     │ • read          │
                        │ • user2Id ──────┼──►  │ • createdAt     │
                        │ • user2Name     │     └─────────────────┘
                        │ • user2Photo    │
                        │ • lastMessage   │
                        │ • lastMessageAt │
                        │ • createdAt     │
                        │ • updatedAt     │
                        └─────────────────┘

RELATIONSHIPS:
─────────────────────────────────────────────────────────────────────
• USERS (1) ──────► (N) PETS         : One user can have many pets
• USERS (1) ──────► (N) MAPSPOTS     : One user can create many map spots
• USERS (N) ◄─────► (N) CHATS        : Many-to-many through participants
• CHATS (1) ──────► (N) MESSAGES     : One chat has many messages
• USERS (1) ──────► (N) MESSAGES     : One user sends many messages
```

## Collections Detail

### 1. USERS Collection
Stores user profile information.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | string (auto) | Unique user identifier (Firebase Auth UID) | ✓ |
| email | string | User's email address | ✓ |
| displayName | string | User's display name | ✗ |
| photoURL | string | Profile photo (base64 data URL) | ✗ |
| city | string | User's city | ✗ |
| bio | string | User biography | ✗ |
| favorites | array[string] | Array of favorite pet IDs | ✗ |
| createdAt | timestamp | Account creation date | ✓ |
| updatedAt | timestamp | Last profile update | ✓ |

**Example Document:**
```json
{
  "id": "GmZswCv8HPc5tPJlfe1gNqDr8r33",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "data:image/jpeg;base64,/9j/4AAQ...",
  "city": "Istanbul",
  "bio": "Animal lover",
  "favorites": ["pet123", "pet456"],
  "createdAt": "2025-12-03T08:21:22.008Z",
  "updatedAt": "2025-12-03T08:22:43.322Z"
}
```

---

### 2. PETS Collection
Stores pet adoption listings.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | string (auto) | Unique pet identifier | ✓ |
| ownerId | string | Reference to user who created listing | ✓ |
| name | string | Pet's name | ✓ |
| species | string | Pet type: "dog", "cat", "other" | ✓ |
| breed | string | Pet breed | ✓ |
| ageMonths | number | Pet's age in months | ✓ |
| sex | string | "male" or "female" | ✓ |
| size | string | "small", "medium", "large" | ✓ |
| photos | array[string] | Array of photo URLs (base64) | ✓ |
| videos | array[string] | Array of video URLs | ✗ |
| description | string | Pet description | ✓ |
| city | string | Location city | ✓ |
| vaccinated | boolean | Vaccination status | ✓ |
| neutered | boolean | Neutering status | ✓ |
| tags | array[string] | Characteristic tags | ✗ |
| createdAt | timestamp | Listing creation date | ✓ |
| updatedAt | timestamp | Last update date | ✓ |

**Example Document:**
```json
{
  "id": "abc123xyz",
  "ownerId": "GmZswCv8HPc5tPJlfe1gNqDr8r33",
  "name": "Max",
  "species": "dog",
  "breed": "Golden Retriever",
  "ageMonths": 24,
  "sex": "male",
  "size": "large",
  "photos": ["data:image/jpeg;base64,..."],
  "videos": [],
  "description": "Friendly and playful dog looking for a loving home",
  "city": "Istanbul",
  "vaccinated": true,
  "neutered": true,
  "tags": ["friendly", "trained", "good with kids"],
  "createdAt": "2025-12-15T10:30:00.000Z",
  "updatedAt": "2025-12-15T10:30:00.000Z"
}
```

---

### 3. CHATS Collection
Stores chat threads between users.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | string | Composite key: "userId1_userId2" (sorted) | ✓ |
| participants | array[string] | Array of two user IDs | ✓ |
| user1Id | string | First user's ID | ✓ |
| user1Name | string | First user's display name | ✓ |
| user1Photo | string | First user's photo URL | ✗ |
| user2Id | string | Second user's ID | ✓ |
| user2Name | string | Second user's display name | ✓ |
| user2Photo | string | Second user's photo URL | ✗ |
| lastMessage | string | Preview of last message | ✗ |
| lastMessageAt | timestamp | Time of last message | ✗ |
| createdAt | timestamp | Chat creation date | ✓ |
| updatedAt | timestamp | Last update date | ✓ |

**Example Document:**
```json
{
  "id": "user123_user456",
  "participants": ["user123", "user456"],
  "user1Id": "user123",
  "user1Name": "John",
  "user1Photo": "data:image/jpeg;base64,...",
  "user2Id": "user456",
  "user2Name": "Jane",
  "user2Photo": "data:image/jpeg;base64,...",
  "lastMessage": "Is the pet still available?",
  "lastMessageAt": "2025-12-20T14:30:00.000Z",
  "createdAt": "2025-12-18T09:00:00.000Z",
  "updatedAt": "2025-12-20T14:30:00.000Z"
}
```

---

### 4. MESSAGES Collection
Stores individual chat messages.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | string (auto) | Unique message identifier | ✓ |
| threadId | string | Reference to chat ID | ✓ |
| senderId | string | Reference to sender user ID | ✓ |
| text | string | Message content | ✓ |
| read | boolean | Read status | ✓ |
| createdAt | timestamp | Message sent time | ✓ |

**Example Document:**
```json
{
  "id": "msg789",
  "threadId": "user123_user456",
  "senderId": "user123",
  "text": "Hello! Is Max still available for adoption?",
  "read": true,
  "createdAt": "2025-12-20T14:30:00.000Z"
}
```

---

### 5. MAPSPOTS Collection
Stores community map markers (feeding spots, water stations, etc.).

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | string (auto) | Unique spot identifier | ✓ |
| creatorId | string | Reference to creator user ID | ✓ |
| name | string | Spot name | ✓ |
| type | string | "feeding", "water", "shelter", "vet" | ✓ |
| coords | object | {latitude: number, longitude: number} | ✓ |
| photoURL | string | Spot photo (base64) | ✗ |
| note | string | Additional notes | ✗ |
| contributorsCount | number | Number of contributors | ✓ |
| createdAt | timestamp | Creation date | ✓ |
| updatedAt | timestamp | Last update date | ✓ |

**Example Document:**
```json
{
  "id": "spot123",
  "creatorId": "GmZswCv8HPc5tPJlfe1gNqDr8r33",
  "name": "Park Feeding Station",
  "type": "feeding",
  "coords": {
    "latitude": 41.0082,
    "longitude": 28.9784
  },
  "photoURL": "data:image/jpeg;base64,...",
  "note": "Daily feeding at 8 AM",
  "contributorsCount": 5,
  "createdAt": "2025-12-10T08:00:00.000Z",
  "updatedAt": "2025-12-19T16:45:00.000Z"
}
```

---

## Data Relationships

### NoSQL vs SQL Approach

| Aspect | SQL (Traditional) | Firestore (NoSQL) |
|--------|-------------------|-------------------|
| Schema | Fixed, predefined | Flexible, dynamic |
| Relationships | Foreign keys, JOINs | Document references, denormalization |
| Scaling | Vertical | Horizontal |
| Queries | Complex JOINs | Simple queries, client-side joins |

### Relationship Implementation

1. **User → Pets (One-to-Many)**
   - `pets.ownerId` stores the user's document ID
   - Query: `where('ownerId', '==', userId)`

2. **User → MapSpots (One-to-Many)**
   - `mapSpots.creatorId` stores the user's document ID
   - Query: `where('creatorId', '==', userId)`

3. **Users ↔ Chats (Many-to-Many)**
   - `chats.participants` array contains both user IDs
   - Chat ID is composite: sorted user IDs joined with underscore
   - Denormalized user info (name, photo) stored in chat document

4. **Chat → Messages (One-to-Many)**
   - `messages.threadId` references the chat document ID
   - Query: `where('threadId', '==', chatId)`

---

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Pets are readable by all authenticated users
    match /pets/{petId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.ownerId;
    }
    
    // Chats accessible only to participants
    match /chats/{chatId} {
      allow read, write: if request.auth.uid in resource.data.participants;
    }
    
    // Messages accessible to chat participants
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Map spots readable by all, writable by creator
    match /mapSpots/{spotId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.creatorId;
    }
  }
}
```

---

## Indexing

Firestore automatically indexes all fields. Custom composite indexes are created for:

1. **pets** - `ownerId` + `createdAt` (for user's pets sorted by date)
2. **messages** - `threadId` + `createdAt` (for chat messages sorted by date)
3. **chats** - `participants` + `lastMessageAt` (for user's chats sorted by recent)

---

## Why Firestore for This Project?

| Benefit | Description |
|---------|-------------|
| **Real-time Sync** | Messages and data update instantly across devices |
| **Offline Support** | App works offline, syncs when connected |
| **Scalability** | Handles millions of users without configuration |
| **Free Tier** | Generous free quota for development and small apps |
| **Firebase Integration** | Seamless auth, storage, and hosting integration |
| **Mobile Optimized** | SDKs optimized for React Native/Expo |

---

## Statistics

- **Collections**: 5
- **Total Fields**: ~45
- **Relationships**: 5 (implemented via document references)
- **Real-time Listeners**: 3 (messages, chats, mapSpots)
