# NovelNest — CodeAlpha Social Mini App

NovelNest is a social reading platform that combines novel discovery,
personal reading lists, reviews, and reader-to-reader interaction in one
modern literary experience.

The application allows readers to discover novels, save books to their
reading list, share thoughts and reviews, discover other readers, follow
them, and receive notifications when other users interact with their
content.

---

## 📖 About the Project

NovelNest is designed around three main ideas:

📚 Discover stories  
👥 Connect with readers  
💬 Share thoughts

Instead of being only a digital book catalogue, NovelNest provides a
social environment where readers can discover books and connect with people
who share similar interests.

---

# ✨ Features

## 🔐 Authentication

- User registration
- User login
- Logout
- Protected authenticated routes
- Session persistence
- Authentication state restoration
- Authenticated user-specific data

Authentication is powered by Supabase Auth.

---

## 👤 Reader Profiles

Each reader can create and manage a personal profile containing:

- Full name
- Username / handle
- Profile picture
- Biography
- Favourite genres
- Favourite authors
- Currently reading

Readers can discover and open other users' public profiles.

Public profile pages do not expose users' email addresses.

---

## 🔎 Reader Search

Readers can search for other users using:

- Reader name
- Username / handle

After finding another reader, a user can open their public profile and
interact with them.

---

## 🤝 Reader-to-Reader Interaction

Authenticated readers can:

- Follow other readers
- Unfollow readers
- View follower counts
- View following information
- Discover followers
- Receive follow notifications

The reader-to-reader interaction was tested using two separate
authenticated users against the live Supabase backend.

---

## 🔔 Notifications

NovelNest includes a complete notification system.

Supported notification types include:

- Follow notifications
- Like notifications
- Comment notifications

Users can:

- View notifications
- Filter notifications
- See unread notifications
- Mark notifications as read
- Delete notifications
- View the unread notification count

Self-notifications are prevented.

---

## 📝 Social Feed

Authenticated readers can:

- Create posts
- View posts
- Like posts
- Unlike posts
- Add comments
- Delete their own comments
- Edit their own posts
- Delete their own posts

The feed supports realtime updates through Supabase.

---

## 📚 Novel Discovery

The novel section allows users to discover and explore books.

Novel pages can contain:

- Book cover
- Title
- Author
- Genre
- Rating
- Synopsis
- Reviews
- Reading-list controls

---

## 📌 Reading List

Authenticated readers can save novels to their personal reading list.

Users can:

- Add novels to their reading list
- Remove novels from their reading list
- View saved novels in the Reading Room

Reading-list data is persisted in the Supabase database.

---

## ⭐ Reviews & Thoughts

Readers can share their opinions about novels.

Users can:

- Give a star rating
- Write a thought/review
- Publish a review
- Edit their review
- Delete their review

Reviews are stored in the live Supabase database.

---

## ❤️ Likes & Comments

The social feed supports:

- Like / unlike
- Optimistic UI updates
- Comment creation
- Comment deletion
- Realtime updates
- Social notifications

---

## 🔍 Search

The application provides search functionality for:

- Novels
- Readers

Search results are retrieved from the live database.

---

## 📱 Responsive Design

The application is designed for:

- Desktop
- Tablet
- Mobile

The interface includes:

- Responsive layouts
- Mobile navigation
- Loading states
- Error states
- Empty states
- Touch-friendly controls

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- TanStack Router

## Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Row Level Security (RLS)
- Supabase Realtime

## Development Tools

- Git
- GitHub
- VS Code
- Node.js / npm

---

# 🗄️ Database

NovelNest uses Supabase PostgreSQL as its main database.

Important tables include:

```text
profiles
posts
likes
comments
follows
notifications
novels
reviews
reading_list

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
