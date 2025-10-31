# Frontend - Social Media Analytics Platform

Next.js frontend application with TypeScript and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
frontend/
├── app/                  # Next.js app directory
│   ├── globals.css       # Global styles
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/              # UI component library
│   ├── layout/          # Layout components
│   └── features/        # Feature-specific components
├── lib/                  # Utilities and helpers
│   └── design-system.ts # Design tokens
└── styles/               # Additional styles
```

## 🎨 Design System

The application uses a modern design system built with Tailwind CSS:

- **Colors:** Primary (blue/purple), Secondary, Accent, Status colors
- **Typography:** Inter (body), Poppins (headings)
- **Components:** Custom UI components (Button, Card, etc.)
- **Spacing:** Consistent spacing scale
- **Animations:** Smooth transitions and micro-interactions

See `lib/design-system.ts` for design tokens.

## 📝 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🎯 UI Components

### Available Components

- `Button` - Button component with variants
- `Card` - Card component with hover effects

More components will be added as development progresses.

### Usage Example

```tsx
import { Button, Card } from '@/components/ui';

export default function Page() {
  return (
    <Card>
      <Button variant="primary" size="md">
        Click Me
      </Button>
    </Card>
  );
}
```

## 🎨 Styling

The application uses Tailwind CSS with custom configuration. Custom utility classes are available:

- `.btn`, `.btn-primary`, `.btn-secondary` - Button styles
- `.card`, `.card-hover` - Card styles
- `.input`, `.input-error` - Input styles
- `.badge`, `.badge-primary` - Badge styles

## 📦 Dependencies

### Main Dependencies
- `next` - React framework
- `react` - UI library
- `react-dom` - React DOM renderer

### Dev Dependencies
- `typescript` - TypeScript
- `tailwindcss` - CSS framework
- `eslint` - Code linting
- `prettier` - Code formatting

## 🔗 API Integration

The frontend communicates with the backend API at `http://localhost:5001`.

API integration utilities will be added in later phases.

## 🐛 Troubleshooting

### Port Already in Use
- Change port: `npm run dev -- -p 3001`

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
