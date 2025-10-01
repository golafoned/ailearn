import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import { TestDataProvider } from "./contexts/TestDataContext";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <TestDataProvider>
                    <App />
                </TestDataProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
