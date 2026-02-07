// src/components/Sidebar/Sidebar.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaBox, FaList, FaChartBar, FaSearch, FaChartLine, FaBars, FaTimes,
  FaPlus, FaWarehouse, FaAngleDown, FaAngleUp, FaUser, FaMoneyBill,
  FaMoneyBillAlt, FaBook, FaTruck, FaCreditCard, FaAddressBook, FaEye, FaIndustry
} from "react-icons/fa";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isGodownOpen, setIsGodownOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isTaxOpen, setIsTaxOpen] = useState(false);

  const userType = localStorage.getItem("userType") || "worker";
  const userName = localStorage.getItem("username"); 

  // Dynamically set panel title
  const panelTitle = userType === "admin" ? "Admin Panel" : "User Panel";

  // ────── Permission Matrix ──────
  const can = {
    inventory: userType === "admin",
    godown: ["admin"].includes(userType),
    billing: userType === "admin",
    accounts: ["admin", "worker"].includes(userType),
    analysis: userType === "admin",
    search: ["admin", "agent", "worker"].includes(userType),
    analytics: userType === "admin",
    profile: userType === "admin",
    delivey: ["admin", "agent", "worker"].includes(userType),
    tax: userType === 'admin'
  };

  // ────── Navigation Items ──────
  const navItems = [
    {
      name: "Inventory",
      allowed: can.inventory,
      icon: <FaBox className="mr-2" />,
      subItems: [
        { name: "Add Product", path: "/inventory", icon: <FaPlus className="mr-2" /> },
        { name: "Listing", path: "/listing", icon: <FaList className="mr-2" /> },
      ],
    },
    {
      name: "Godown",
      allowed: can.godown,
      icon: <FaWarehouse className="mr-2" />,
      subItems: [
        { name: "Add Stock", path: "/godown", icon: <FaPlus className="mr-2" /> },
        { name: "View Stocks", path: "/viewstock", icon: <FaList className="mr-2" /> },
      ],
    },
    {
      name: "Billing",
      allowed: can.billing,
      icon: <FaMoneyBillAlt className="mr-2" />,
      subItems: [
        { name: "Bill", path: "/book", icon: <FaMoneyBill className="mr-2" /> },
        { name: "Overall Billings", path: "/allbookings", icon: <FaList className="mr-2" /> },
      ],
    },
    {
      name: "Accounts",
      allowed: can.accounts,
      icon: <FaBook className="mr-2" />,
      subItems: [
        { name: "Admin", path: "/adm", icon: <FaBook className="mr-2" /> },
        { name: "Ledger", path: "/ledger", icon: <FaBook className="mr-2" /> },
        { name: "Dispatch", path: "/dispatch", icon: <FaTruck className="mr-2" /> },
        { name: "Payments", path: "/payments", icon: <FaCreditCard className="mr-2" /> },
      ],
    },
    {
      name: "Tax Invoices",
      allowed: can.tax,
      icon: <FaAddressBook className="mr-2" />,
      subItems: [
        { name: "Inventory", path: "/taxinventory", icon: <FaBox className="mr-2" /> },
        { name: "Create Company", path: "/createcompany", icon: <FaIndustry className="mr-2" /> },
        { name: "View Company", path: "/viewcompany", icon: <FaEye className="mr-2" /> },
        { name: "Tax Bills", path: "/taxbills", icon: <FaBook className="mr-2" /> },
        { name: "All Bills", path: "/allbills", icon: <FaMoneyBill className="mr-2" /> }
      ],
    },
    { name: "Delivery Challan", path: "/delivery", icon: <FaTruck className="mr-2" />, allowed: can.delivey },
    { name: "Overall Stocks", path: "/analysis", icon: <FaChartBar className="mr-2" />, allowed: can.analysis },
    { name: "Search product", path: "/search", icon: <FaSearch className="mr-2" />, allowed: can.search },
    { name: "Analytics", path: "/analytics", icon: <FaChartLine className="mr-2" />, allowed: can.analytics },
    { name: "Profile", path: "/profile", icon: <FaUser className="mr-2" />, allowed: can.profile },
  ];

  // ────── Toggle Functions ──────
  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleInventory = () => setIsInventoryOpen(!isInventoryOpen);
  const toggleGodown = () => setIsGodownOpen(!isGodownOpen);
  const toggleBilling = () => setIsBillingOpen(!isBillingOpen);
  const toggleAccounts = () => setIsAccountsOpen(!isAccountsOpen);
  const toggleTax = () => setIsTaxOpen(!isTaxOpen);

  const getToggle = (name) => {
    switch (name) {
      case "Inventory": return { toggle: toggleInventory, isOpen: isInventoryOpen };
      case "Godown": return { toggle: toggleGodown, isOpen: isGodownOpen };
      case "Billing": return { toggle: toggleBilling, isOpen: isBillingOpen };
      case "Accounts": return { toggle: toggleAccounts, isOpen: isAccountsOpen };
      case "Tax Invoices": return { toggle: toggleTax, isOpen: isTaxOpen };
      default: return { toggle: () => {}, isOpen: false };
    }
  };

  return (
    <>
      {/* Hamburger for mobile */}
      {!isOpen && (
        <button
          className="hundred:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded-md shadow-lg"
          onClick={toggleSidebar}
        >
          <FaBars size={24} />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-black/90 text-white flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } hundred:translate-x-0 mobile:w-64 w-64 z-40 shadow-2xl`}
      >
        <div className="p-5 text-2xl font-extrabold border-b border-gray-700 flex flex-col items-center text-center justify-center bg-gradient-to-r from-blue-900 to-indigo-900">
          {panelTitle}
          <span className="font-semibold text-md capitalize mt-2 text-green-400">{userName}</span>
          <button className="hundred:hidden text-white" onClick={toggleSidebar}>
            <FaTimes size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          <ul>
            {navItems.map((item) => {
              if (!item.allowed) return null;

              const { toggle, isOpen: sectionOpen } = getToggle(item.name);

              return (
                <li key={item.name}>
                  {item.subItems ? (
                    <div>
                      <div
                        className="py-3 px-6 text-sm font-bold text-gray-300 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors rounded-md mx-2"
                        onClick={toggle}
                      >
                        <span className="flex items-center">
                          {item.icon}
                          {item.name}
                        </span>
                        {sectionOpen ? <FaAngleUp /> : <FaAngleDown />}
                      </div>

                      <ul
                        className={`pl-6 overflow-hidden transition-all duration-300 ease-in-out ${
                          sectionOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        {item.subItems.map((sub) => (
                          <li key={sub.name}>
                            <NavLink
                              to={sub.path}
                              className={({ isActive }) =>
                                `flex items-center py-2 px-6 text-sm font-medium hover:bg-white/10 transition-colors rounded-md mx-2 ${
                                  isActive ? "bg-white/20 text-white font-semibold" : "text-gray-300"
                                }`
                              }
                              onClick={() => setIsOpen(false)}
                            >
                              {sub.icon}
                              {sub.name}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center py-3 px-6 text-sm font-medium hover:bg-white/10 transition-colors rounded-md mx-2 ${
                          isActive ? "bg-white/20 text-white font-semibold" : "text-gray-300"
                        }`
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      {item.icon}
                      {item.name}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Optional: Show user type at bottom */}
        <div className="p-4 text-xs text-center text-gray-400 border-t border-gray-700">
          Logged in as: <span className="font-medium text-gray-200 capitalize flex text-center">{userType}</span>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="hundred:hidden fixed inset-0 bg-black/60 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}