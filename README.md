# NeoVision — Eyewear E-Commerce Platform

A full-stack e-commerce web application built for a Kenyan eyewear business,
handling the complete customer shopping experience alongside a powerful
admin console for inventory, order and branch management.

Live at: https://neovision-ykqh.vercel.app/

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Frontend    | React 18, TypeScript, Tailwind CSS              |
| Animation   | Framer Motion                                   |
| Routing     | React Router v6                                 |
| Backend     | Firebase (Firestore, Auth, Storage, Functions)  |
| Payments    | Safaricom Daraja M-Pesa STK Push                |
| Hosting     | Firebase Hosting                                |
| Notifications | React Hot Toast                               |

---

## Features

### Authentication & Access Control
- Google Sign-In via Firebase Authentication
- Role-based access control — `admin` and `customer` roles stored in Firestore
- Protected admin routes enforced both client-side (React Router) and
  server-side (Firestore security rules)
- Roles resolved from Firestore on every auth state change — not from
  client-supplied data

### Customer Experience
- Landing page with scroll-triggered Framer Motion animations
- Product shop with category tabs (Frames, Contact Lenses, Sunglasses)
  and fetch-on-demand caching — maximum 3 Firestore reads per full session
- Individual product pages with color circle selectors, size chips,
  per-branch stock availability indicators, and quantity stepper
- Persistent shopping cart backed by localStorage — survives page refreshes
- Full checkout flow with delivery details (name, M-Pesa phone, address, notes)
- Real-time order tracking with a vertical timeline showing all order
  stages and timestamps, powered by Firestore onSnapshot listeners

### M-Pesa Payment Integration
- Safaricom Daraja STK Push via a Firebase Cloud Function (europe-west3)
- Phone number normalisation to Daraja format (2547XXXXXXXX)
- Order document created in Firestore before STK push is triggered
- Daraja callback webhook updates order paymentStatus on payment confirmation
- Frontend listens to the order document in real-time — payment confirmation
  clears the cart and shows success UI automatically
- M-Pesa receipt number stored on the order for customer and admin reference

### Multi-Branch Inventory Management
- Two branches: NeoVision Nairobi CBD and NeoVision Kikuyu
- Stock tracked per branch on every product document
- Fulfilling branch auto-selected at order time based on highest combined
  stock across all ordered items
- Atomic Firestore transaction decrements stock at checkout —
  prevents overselling under concurrent orders
- Fallback logic: if primary branch has insufficient stock for an item,
  remainder is pulled from the other branch
- Configurable low-stock threshold per product — alerts surface in the
  admin dashboard when any branch breaches the threshold

### Admin Console
- Dark-themed dashboard with fixed sidebar and branch filter
- Hybrid stats: pending orders and today's items via real-time listeners;
  revenue and completed orders via on-demand fetch with manual refresh
- Full product CRUD — add, edit, delete with:
  - Client-side WebP image conversion using the Canvas API
  - Color palette (10 presets + custom hex picker with live preview)
  - Frame size management (Small / Medium / Large)
  - Per-branch stock steppers with +/− controls
  - Configurable low-stock alert threshold
- Low-stock alert panel surfaces products below threshold across all branches
- Orders management page — real-time list sorted newest first, expandable
  order rows with full delivery, payment and item details
- Status advancement buttons show only the next valid step:
  pending → processing → completed → dispatched → delivered
- Branch seeding on first admin load via a one-time Firestore write

### Image Optimisation
- Any uploaded image (JPG, PNG, etc.) is converted to WebP client-side
  using the browser Canvas API before upload
- Original file never reaches Firebase Storage
- Quality set to 0.85 — significant size reduction with no visible degradation

---


