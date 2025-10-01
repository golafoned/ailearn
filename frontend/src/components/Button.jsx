import React from "react";

const variants = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-300",
    secondary:
        "text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-gray-200",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-300",
};

export function Button({
    children,
    onClick,
    className = "",
    variant = "primary",
    disabled = false,
    type = "button",
}) {
    const base =
        "inline-flex items-center justify-center px-5 py-3 text-base font-medium rounded-lg focus:outline-none focus:ring-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
