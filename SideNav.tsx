import React from "react";
import { LayoutDashboard, BarChart2, LogOut, KeyRound, X } from "lucide-react";
import cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import KeyModal from "../modals/keyModal";
import { toast } from "sonner";

interface SideNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, onToggle }) => {
  const [isKeyModalOpen, setIsKeyModalOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onToggle(); // Close menu
    cookies.remove("auth");
    navigate("/login");
    toast.info("Successfully logged out");
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 right-0 z-50 w-64 bg-gray-900 border-l border-gray-800 transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <BarChart2 className="text-blue-500 flex-shrink-0" size={24} />
            <span className="text-lg font-semibold text-white whitespace-nowrap">
              TradeDeck
            </span>
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-5rem)] justify-between p-4">
          {/* Navigation Links */}
          <div className="flex flex-col space-y-1">
            <a
              href="#"
              className="flex items-center text-gray-400 px-3 py-2 rounded-md hover:text-white hover:bg-gray-800 transition-colors"
              onClick={onToggle}
            >
              <LayoutDashboard className="flex-shrink-0" size={18} />
              <span className="ml-3 whitespace-nowrap">Dashboard</span>
            </a>
          </div>

          <div>
            <button
              className="flex items-center text-gray-400 px-3 py-2 rounded-md hover:text-white hover:bg-gray-800 transition-colors mt-auto w-full"
              onClick={() => setIsKeyModalOpen(true)}
            >
              <KeyRound className="flex-shrink-0" size={18} />
              <span className="ml-3 whitespace-nowrap">Update API Key</span>
            </button>

            <button
              className="flex items-center text-gray-400 px-3 py-2 rounded-md hover:text-white hover:bg-gray-800 transition-colors mt-auto w-full"
              onClick={handleLogout}
            >
              <LogOut className="flex-shrink-0" size={18} />
              <span className="ml-3 whitespace-nowrap">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <KeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />
    </>
  );
};

export default SideNav;
