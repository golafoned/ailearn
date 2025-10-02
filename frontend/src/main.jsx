import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import { TestDataProvider } from "./contexts/TestDataContext";
import { ToastProvider } from "./contexts/ToastContext";
import { LearningProvider } from "./contexts/LearningContext";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <TestDataProvider>
                        <LearningProvider>
                            <App />
                        </LearningProvider>
                    </TestDataProvider>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    </StrictMode>
);
