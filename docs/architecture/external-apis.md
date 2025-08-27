# External APIs

Based on the PRD requirements and our vanilla JS architecture, here are the external API integrations:

## Stripe API

- **Purpose:** Payment processing for tea purchases
- **Documentation:** https://stripe.com/docs/api
- **Base URL(s):** Client-side via Stripe.js
- **Authentication:** Publishable key (client), Secret key (server)
- **Rate Limits:** No strict limits for normal usage

**Key Endpoints Used:**

- Client-side: Stripe Elements, Payment Intents (via Stripe.js)
- Server-side webhooks: `POST /stripe/webhook` - Payment confirmations

**Integration Notes:**

- Use Firebase Extension "Run Payments with Stripe" for simplified integration
- Stripe.js handles PCI compliance by tokenizing cards client-side
- Webhooks secured with signature verification

## SendGrid API (via Firebase Extension)

- **Purpose:** Transactional email delivery
- **Documentation:** Handled by Firebase Extension
- **Base URL(s):** N/A - Extension manages this
- **Authentication:** API key stored in Extension config
- **Rate Limits:** Based on SendGrid plan

**Key Endpoints Used:**

- Extension auto-triggers on Firestore document writes
- Email templates stored in Firestore

**Integration Notes:**

- "Trigger Email" Firebase Extension handles all API calls
- No direct integration needed in our code
- Email templates use Handlebars syntax

## Google OAuth API

- **Purpose:** Social login for customer convenience
- **Documentation:** Handled by Firebase Auth
- **Base URL(s):** N/A - Firebase SDK manages
- **Authentication:** OAuth 2.0 flow via Firebase
- **Rate Limits:** Standard Google quotas

**Key Endpoints Used:**

- All handled through Firebase Auth SDK
- `firebase.auth().signInWithPopup(googleProvider)`

**Integration Notes:**

- Configure in Firebase Console
- No direct API calls needed
- Provides user email and basic profile

## Firebase Services (Internal APIs)

- **Purpose:** Core platform services
- **Documentation:** https://firebase.google.com/docs
- **Base URL(s):** Various Firebase endpoints
- **Authentication:** Firebase SDK handles automatically
- **Rate Limits:** Generous free tier limits

**Key Services:**

- Firestore: 50K reads/20K writes per day (free)
- Auth: 10K verifications per month (free)
- Storage: 5GB stored, 1GB/day download (free)
- Functions: 125K invocations per month (free)

**Integration Notes:**

- All accessed via Firebase SDK
- Real-time listeners count as single read
- Batch operations to optimize quota usage
