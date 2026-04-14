import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, ShoppingBag } from 'lucide-react';
import { useApp } from '../AppContext';
import CheckoutModal from '../components/CheckoutModal';
import DelayedAuthModal from '../components/DelayedAuthModal';
import CommandSearch from '../components/CommandSearch';

export default function MainLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { cartItems, globalToast } = useApp();

  return (
    <div className="flex min-h-screen bg-zinc-50 relative overflow-x-hidden text-zinc-900">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-orange-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Sidebar Toggle Button (Floating when collapsed) */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={`fixed top-6 left-6 z-50 p-3 rounded-2xl bg-white text-zinc-900 border border-zinc-200 shadow-xl hover:bg-zinc-50 transition-all duration-300 ${
          isSidebarCollapsed ? 'translate-x-0' : 'translate-x-64 opacity-0 pointer-events-none'
        }`}
      >
        <Menu size={24} />
      </button>

      {/* Global Shopping Cart Button */}
      <button
        onClick={() => setIsCheckoutOpen(true)}
        className="fixed top-6 right-6 lg:right-12 z-50 p-4 rounded-2xl bg-[#0A192F] text-white shadow-2xl hover:bg-black transition-all group"
      >
        <ShoppingBag size={24} className="group-hover:scale-110 transition-transform" />
        {cartItems.length > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white shadow-md">
            {cartItems.length}
          </span>
        )}
      </button>

      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      
      <main className="flex-1 relative z-10 pt-8 sm:pt-0">
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-4 sm:p-8 pt-20 sm:pt-8 max-w-7xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Checkout Hub */}
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      
      {/* Global Toast Notification */}
      <AnimatePresence>
        {globalToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-10 left-1/2 z-[100] bg-white text-[#0A192F] px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-zinc-100"
          >
            <ShoppingBag className="text-orange-500" size={20} />
            <span className="font-bold text-sm">{globalToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Command Hub */}
      <CommandSearch />

      {/* Delayed Public Auth Wall */}
      <DelayedAuthModal />
    </div>
  );
}
