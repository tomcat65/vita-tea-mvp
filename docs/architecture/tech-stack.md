# Tech Stack

This is the DEFINITIVE technology selection for the entire project. All development must use these exact versions:

## Technology Stack Table

| Category             | Technology             | Version  | Purpose                   | Rationale                                   |
| -------------------- | ---------------------- | -------- | ------------------------- | ------------------------------------------- |
| Frontend Language    | JavaScript (ES6+)      | Modern   | Client-side logic         | No build step, native browser support       |
| Frontend Framework   | Vanilla JS             | N/A      | No framework              | Maximum simplicity, zero dependencies       |
| UI Component Library | Web Components         | Native   | Reusable components       | Native browser API, no framework needed     |
| UI Enhancement       | Alpine.js              | 3.x      | Declarative reactivity    | 15KB, no build step, HTML-first             |
| Backend Language     | TypeScript             | 5.3+     | Cloud Functions only      | Type safety for critical backend code       |
| Backend Framework    | Firebase Functions     | 4.9+     | Serverless functions      | Payment processing, admin operations        |
| API Style            | Client SDK + Functions | N/A      | Hybrid approach           | Direct Firestore access + secure operations |
| Database             | Firestore              | latest   | NoSQL document database   | Real-time, scalable, managed                |
| Cache                | Browser Cache          | Native   | Static asset caching      | Service worker for offline support          |
| File Storage         | Cloud Storage          | latest   | Media storage             | Product images with CDN                     |
| Authentication       | Firebase Auth          | latest   | User authentication       | Email/password + Google OAuth               |
| Frontend Testing     | None (MVP)             | N/A      | Manual testing initially  | Focus on shipping, add tests post-launch    |
| Backend Testing      | Jest                   | 29+      | Functions testing         | Firebase emulator for critical paths        |
| E2E Testing          | Manual + GA            | N/A      | User testing              | Real user data via Analytics                |
| Build Tool           | None                   | N/A      | No build process          | Direct file serving                         |
| Bundler              | None                   | N/A      | No bundling               | ES6 modules for organization                |
| IaC Tool             | Firebase CLI           | 13.0+    | Infrastructure deployment | firebase.json configuration                 |
| CI/CD                | GitHub Actions         | N/A      | Simple deployment         | firebase deploy on push                     |
| Monitoring           | Firebase Analytics     | latest   | User behavior tracking    | Conversion funnel optimization              |
| Logging              | Console + Cloud        | latest   | Simple logging            | Browser console + Cloud Functions logs      |
| CSS Framework        | Tailwind CSS           | 3.4+ CDN | Utility-first CSS         | Via CDN, no build required                  |
