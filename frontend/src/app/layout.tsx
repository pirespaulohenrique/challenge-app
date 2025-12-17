import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeContextProvider } from '@/context/ThemeContext';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <AppRouterCacheProvider>
          <ThemeContextProvider>
            {children}
          </ThemeContextProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}