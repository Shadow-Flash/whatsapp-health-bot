# 📲 WhatsApp Bot with Google Sheets as DB

A production-ready **WhatsApp Bot** built using **Meta WhatsApp Cloud API** and **Google APIs**, designed to collect user inputs (like health readings) via WhatsApp and reliably store them in **Google Sheets** using OAuth-based user authorization.

This project focuses on:

* Clean webhook handling
* Secure OAuth token management
* Asynchronous, non-blocking UX for WhatsApp users
* Streamlined backend architecture for extensibility

---

## ✨ Features

* 📩 Receive WhatsApp messages via Meta Webhooks
* 🔘 Interactive message flows (buttons & replies)
* 🔐 Google OAuth 2.0 user authentication
* 📊 Store user-provided data in Google Sheets
* ♻️ Token refresh & session validation
* 🧠 User-first UX (instant confirmation, async storage)
* 🪵 Structured logging with configurable levels

---

## 🏗️ Architecture Overview

```
User (WhatsApp)
   ↓
Meta WhatsApp Cloud API
   ↓ Webhook Events
Backend Server (Node.js + Express)
   ├─ Webhook Verification
   ├─ Message Parsing
   ├─ Flow Controller
   ├─ Google OAuth Handler
   ├─ Google Sheets Writer
   └─ Logging & Error Handling
```

---

## 🧰 Tech Stack

| Layer             | Technology              |
| ----------------- | ----------------------- |
| Runtime           | Node.js                 |
| Backend Framework | Express                 |
| Messaging API     | Meta WhatsApp Cloud API |
| Auth              | Google OAuth 2.0        |
| Storage           | Google Sheets           |
| Logging           | Pino                    |
| HTTP Client       | Axios                   |

---

## 🔄 Message Flow (High Level)

1. User sends a message on WhatsApp
2. Meta sends webhook event to backend
3. Backend validates webhook signature
4. Message is parsed and routed to flow controller
5. User receives immediate confirmation
6. Data is asynchronously stored in Google Sheets
7. Errors are logged without blocking UX

---

## 🔐 Google OAuth Flow

1. User initiates a Google Sheets connection via WhatsApp
2. Bot sends OAuth consent URL
3. User grants access
4. Google redirects to backend callback
5. Access & refresh tokens are stored securely
6. Tokens are refreshed automatically when expired

---

## 🌍 Environment Variables

This project relies on the following environment variables to integrate **WhatsApp Cloud API (Meta)** and **Google OAuth + Google Sheets API**.

Create a `.env` file at the root of the project and define the variables listed below.

---

## 📲 WhatsApp Cloud API (Meta)

### `GRAPH_API_TOKEN`

Access token used to authenticate all requests to the Meta Graph API.

**Source:**
Meta Developer Dashboard → App → WhatsApp → API Setup

**Used for:**

* Sending WhatsApp messages
* Fetching message status
* Calling WhatsApp Cloud API endpoints

---

### `WEBHOOK_VERIFY_TOKEN`

Custom secret string used during webhook verification.

**Source:**
Manually created by you (any random string)

**Used for:**

* Validating webhook ownership during Meta’s `GET` verification request

---

### `PORT`

Port number on which the backend server runs.

**Source:**

* Local: chosen manually (e.g. `3000`)
* Production: provided by hosting platform

**Used for:**

* Starting the HTTP server

---

### `PHONE_NUMBER_ID`

Unique identifier for the WhatsApp Business phone number.

**Source:**
Meta Developer Dashboard → WhatsApp → API Setup → Phone Number ID

**Used for:**

* Sending messages via WhatsApp Cloud API

---

### `PINO_LOG_LEVEL`

Controls logging verbosity.

**Common values:**
`debug`, `info`, `warn`, `error`

**Used for:**

* Configuring application logging

---

### `TESTING_NUMBER`

WhatsApp number approved for testing without full production access.

**Source:**
Meta Developer Dashboard → WhatsApp → API Setup → Test Numbers

**Used for:**

* Development and testing only

---

### `WHATSAPP_API_VERSION`

Specifies the WhatsApp Cloud API version used in requests.

**Example:**
`v20.0`, `v24.0`

**Source:**
Meta WhatsApp Cloud API documentation

**Used for:**

* Building Graph API URLs
* Managing breaking changes

---

## 🔑 Google OAuth & Google Sheets API

### `CLIENT_ID_GOOGLE_API`

OAuth client identifier for Google authentication.

**Source:**
Google Cloud Console → APIs & Services → Credentials → OAuth Client ID

**Used for:**

* Initiating Google OAuth flow

---

### `CLIENT_SECRET_GOOGLE_API`

Private secret associated with the Google OAuth client.

**Source:**
Google Cloud Console → OAuth Client details

**Used for:**

* Exchanging authorization codes
* Refreshing access tokens

⚠️ Must never be exposed to frontend

---

### `REDIRECT_URI_GOOGLE_API`

Callback URL where Google redirects users after consent.

**Example:**
`https://yourdomain.com/auth/google/callback`

**Source:**
Defined by you and registered in Google Cloud Console

**Used for:**

* Completing OAuth authentication

---

### `SCOPES_GOOGLE_API`

Space-separated list of Google API permissions requested.

**Example:**
`https://www.googleapis.com/auth/drive.file`

**Source:**
Google API documentation

**Used for:**

* Determining access level to Google services

---

## 📄 Example `.env`

```env
GRAPH_API_TOKEN=
WEBHOOK_VERIFY_TOKEN=
PORT=3000
PHONE_NUMBER_ID=
PINO_LOG_LEVEL=debug
TESTING_NUMBER=
WHATSAPP_API_VERSION=v24.0

CLIENT_ID_GOOGLE_API=
CLIENT_SECRET_GOOGLE_API=
REDIRECT_URI_GOOGLE_API=
SCOPES_GOOGLE_API=
```


Includes:

* WhatsApp Cloud API credentials
* Google OAuth credentials
* Logging & runtime configuration

---

## 🚀 Local Development

### 1️⃣ Install Dependencies

```bash
pnpm install
```

### 2️⃣ Configure Environment

```bash
cp .env.example .env
```

Fill in all required values.

### 3️⃣ Start Server

```bash
pnpm run start
```

Server starts on:

```
http://localhost:PORT
```

---

## 🧪 Testing Strategy

* Use WhatsApp **Test Numbers** for development
* Use Google test users in OAuth consent screen
* Validate webhook verification manually
* Log payloads at `debug` level during development

---

## ⚠️ Common Pitfalls

* Redirect URI mismatch in Google OAuth
* Expired Google access tokens not refreshed
* Incorrect Phone Number ID usage
* Forgetting to reply within WhatsApp webhook timeout

---

## 🔒 Security Notes

* Never expose Google Client Secret
* Do not commit `.env` files
* Rotate Meta access tokens periodically
* Validate all inbound webhook payloads

---

## 🛠️ Extensibility Ideas

* Multiple Google Sheets per user
* User-specific schemas
* Scheduled summaries
* Data validation & normalization
* Admin dashboard

---

## 📌 Design Philosophy

* **User-first UX**: Never block WhatsApp replies
* **Async everything**: Background persistence
* **Config-driven**: No hardcoded secrets
* **Composable flows**: Easy to add new message types

---

## 📄 License

This project is intended for personal and internal use. Add a license if distributing publicly.

## From Author:
This is README.md file created using chatgpt so, it might have some
descrepancies. I tried to remove most of them but just incase.
