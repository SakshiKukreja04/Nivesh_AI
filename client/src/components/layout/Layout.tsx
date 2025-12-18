import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

const Layout = ({ children, isLoggedIn = false, onLogout }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
