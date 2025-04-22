import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-500 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="text-white text-2xl font-bold no-underline">
              GlowSpace
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-white hover:text-gray-200 transition-colors duration-200 no-underline">
              Home
            </Link>
            <Link to="/chatroom" className="text-white hover:text-gray-200 transition-colors duration-200 no-underline">
              Chat
            </Link>
            <Link to="/explore" className="text-white hover:text-gray-200 transition-colors duration-200 no-underline">
              Explore
            </Link>
            <Link to="/profile" className="text-white hover:text-gray-200 transition-colors duration-200 no-underline">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 