# Usage Analytics Dashboard

A beautiful, interactive dashboard for visualizing Claude API usage analytics with stunning visual effects.

## Features

- **Real-time Usage Insights**: View Claude API call analytics with interactive charts and metrics
- **Five-Category Analytics**: Analyze usage across multiple dimensions with detailed breakdowns
- **Theme Selector**: Choose from multiple theme options to customize the dashboard appearance
- **Dynamic Animations**:
  - Night sky background with twinkling stars and dancing auras
  - Sunrise glow effects for smooth visual transitions
  - UAP (Unidentified Animated Phenomena) effects for engaging visual elements
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Type-Safe**: Built with TypeScript for robust development

## Live Demo

Visit the live dashboard: **[https://usage-analytics-dashboard.vercel.app](https://usage-analytics-dashboard.vercel.app)**

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/joshwalkerlive/usage-analytics-dashboard.git
cd usage-analytics-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5174`

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation and theme selector
│   ├── NavTOC.tsx      # Table of contents navigation
│   ├── NightSky.tsx    # Animated night sky background
│   ├── SunriseGlow.tsx # Sunrise glow effects
│   └── ThemeSelector.tsx # Theme selection menu
├── App.tsx             # Main application component
├── index.css           # Global styles
└── main.tsx            # Application entry point
```

## Technologies

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Canvas API** - Advanced graphics rendering

## Customization

### Themes

The dashboard supports multiple theme options. Themes can be customized in the `ThemeSelector` component. Each theme includes:
- Background colors
- Text colors
- Accent colors for charts and UI elements

### Analytics Data

To integrate with real Claude API usage data:
1. Add your API integration to the data fetching layer
2. Update the chart components to visualize your data
3. Connect real-time data streams for live updates

## Deployment

This project is deployed on Vercel and automatically deploys on every push to the `main` branch.

### Deploy Your Own

1. Fork this repository
2. Create a new project on [Vercel](https://vercel.com)
3. Connect your GitHub repository
4. Vercel will automatically detect the Vite configuration and deploy

Or deploy manually:
```bash
npm install -g vercel
vercel --prod
```

## License

MIT

## Support

For questions or issues, please open an issue on [GitHub](https://github.com/joshwalkerlive/usage-analytics-dashboard/issues).
