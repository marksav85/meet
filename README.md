# Meet — Discover. Connect. Create.

Meet is an international technology-event discovery application for exploring
meetups, workshops, conferences, hackathons and networking events. A responsive
interface brings searchable events, community insights and light/dark themes together.

**[Explore the live application](https://meet.marksavilledesigns.com/)**

Google sign-in is required to explore events. The calendar contains **fictional
demonstration events** created for this portfolio project; listings are not real
invitations or registration opportunities.

## Features

- **Explicit Google sign-in:** OAuth 2.0 with random state, S256 PKCE and a
  single-use authorization transaction. The welcome screen waits for user action.
- **Tab-session continuity:** valid sessions survive refreshes in the same tab;
  token expiry and sign-out clear credentials and protected event data.
- **Calendar-backed discovery:** AWS Lambda retrieves upcoming Google Calendar
  occurrences. The frontend caps the chronologically ordered feed at 50 before filtering.
- **City and category filters:** searchable city selection, six category controls
  and a live count of matching events.
- **Data-driven analytics:** a category donut and horizontal city bars use the
  same filtered events as the cards, with interactive Recharts tooltips.
- **Expandable cards:** category badges, dates, times, locations and descriptions
  come from event data. Timed events display in the viewer's local time zone.
- **Responsive themes:** shared light/dark layouts, an accessible toggle, system
  preference detection and persistence of explicit choices.
- **Progressive Web App:** an installable manifest and precached application
  assets; cached Calendar events remain available offline only during a valid session.
- **Accessible interactions:** keyboard city selection, labeled controls,
  expansion states, chart summaries and useful loading, empty and error feedback.

Categories are **Web Development**, **AI & Emerging Tech**, **UX & Creative Tech**,
**Cloud & DevOps**, **Gaming & Interactive**, and **Startups & Networking**.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 18, JavaScript, Vite, Recharts, CSS |
| Backend | Node.js 24, AWS Lambda, API Gateway, Serverless Framework |
| Integrations | Google OAuth 2.0, Google Calendar API |
| Hosting | Cloudflare Pages frontend, AWS backend |
| Testing | Jest, React Testing Library, user-event, jsdom, jest-cucumber, Puppeteer |
| PWA | Vite PWA plugin and Workbox |

## How it works

The React frontend is served by Cloudflare Pages and makes HTTPS requests to an
independent AWS API Gateway/Lambda backend. Google supplies authorization and
Calendar data; no frontend server is needed.

1. **Sign in.** Clicking **Continue with Google** creates a random state and PKCE
   challenge. Lambda returns a validated Google authorization URL. On return, the
   frontend validates and consumes the stored transaction, then asks Lambda to
   exchange the authorization code using its verifier.
2. **Keep a bounded session.** Only the access token and its absolute expiry are
   persisted as credentials in `sessionStorage`. Reloads do not extend that expiry.
   A 30-second safety margin, an expiry timer and request-time checks protect access.
   There are no refresh tokens. Sign-out and rejected credentials clear the session,
   event cache and UI; late requests cannot restore cleared data.
3. **Retrieve and filter events.** Bearer-authenticated Lambda requests retrieve
   upcoming Calendar occurrences in start-time order, expanding recurring events.
   React sorts and caps the feed at 50, then applies city and category filters.
   Category metadata is extracted from description markers rather than inferred
   from titles. Cards, the results count and analytics share the filtered dataset.
4. **Calculate insights.** The city chart counts events by full location. The
   category chart counts recognized markers and calculates percentages among
   categorized events. Missing or ambiguous categories remain visible under
   All Categories but do not contribute to donut percentages.

Offline event data is never proof of authentication. The service worker caches
static assets, not tokens or OAuth/API responses. Browser-readable session tokens
still require protection against XSS; detailed contracts and limitations are in
[AUTHENTICATION.md](AUTHENTICATION.md).

### Key React components

| Component | Responsibility |
| --- | --- |
| `CitySearch` | Search city suggestions and select a location using mouse or keyboard. |
| `CategoryFilter` | Show category counts and select a category within the chosen city. |
| `Event` | Present one event and expand or collapse its description. |
| `EventList` | Render the filtered collection of event cards. |
| `CityEventsChart` | Count matching events by location and draw horizontal bars. |
| `EventGenresChart` | Turn category markers into donut slices, counts and percentages. |

`App` coordinates authentication feedback, loading, the capped dataset and filters.
`ThemeToggle` manages the shared theme and saves explicit preferences.

## Getting started

Use **Node.js 24**. From the repository root:

```sh
npm ci
VITE_DATA_MODE=mock npm start
```

Open **http://localhost:3000/**. Mock mode is the simplest local exploration path:
it uses bundled fixtures without Google sign-in or AWS access. The explicit mode
also overrides local OAuth settings. The development port is fixed.

For real Google OAuth and AWS integration, follow the
[frontend development guide](docs/2-development/workflow--frontend--development.md),
[authentication contracts](AUTHENTICATION.md) and
[backend maintenance guide](auth-server/README.md). Backend dependencies and
configuration are separate from the frontend. Never place client secrets, AWS
credentials or tokens in frontend `VITE_*` variables.

### Testing

```sh
npm test                           # Unit, component and Gherkin scenarios
npm run test:browser               # Keep the mock development server running
npm test --prefix auth-server      # Offline backend tests; install backend dependencies first
npm run check:local --prefix auth-server
```

Browser tests use Puppeteer with a separate Node-based Jest configuration and
block external requests. They require the matching Chrome installation; see the
frontend guide if the browser download was skipped during installation.

### Production build

Build with explicit public production settings. The URLs below are examples;
use your configured API endpoint and exact OAuth callback as described in the
[frontend development guide](docs/2-development/workflow--frontend--development.md):

```sh
VITE_DATA_MODE=oauth \
VITE_API_BASE_URL=https://api.example.com/prod \
VITE_OAUTH_REDIRECT_URI=https://meet.example.com/ \
npm run build
```

Output is `dist/`. `npm run preview` serves it at **http://localhost:4173/** for
static inspection; real OAuth requires an exactly configured callback origin.
The build guard rejects missing or development-oriented release configuration.
Building does not provision AWS resources or deploy the application.

## Deployment and documentation

The completed portfolio application is available at
**[meet.marksavilledesigns.com](https://meet.marksavilledesigns.com/)**. Cloudflare
Pages hosts the frontend; API Gateway and Lambda serve the separate AWS `prod`
stage in `eu-central-1`. The demonstration calendar contains fictional events.

Frontend environment values are embedded at build time. Private Google client
and calendar configuration belongs in the backend deployment environment.
Operational setup and maintenance are documented separately:

- [Documentation index](docs/README.md)
- [Frontend configuration, category markers and PWA behavior](docs/2-development/workflow--frontend--development.md)
- [Authentication and API contracts](AUTHENTICATION.md)
- [Backend checks, configuration and guarded deployment procedures](auth-server/README.md)
- [Repository development guidance](AGENTS.md)
