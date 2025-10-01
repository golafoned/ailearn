import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
} from "react";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timeoutsRef = useRef({});

    const remove = useCallback((id) => {
        setToasts((t) => t.filter((x) => x.id !== id));
        if (timeoutsRef.current[id]) {
            clearTimeout(timeoutsRef.current[id]);
            delete timeoutsRef.current[id];
        }
    }, []);

    const push = useCallback(
        (message, { type = "info", duration = 3500 } = {}) => {
            if (!message) return;
            const id = ++idCounter;
            const toast = { id, message, type };
            setToasts((t) => [...t, toast]);
            if (duration > 0) {
                timeoutsRef.current[id] = setTimeout(
                    () => remove(id),
                    duration
                );
            }
            return id;
        },
        [remove]
    );

    const value = {
        toasts,
        push,
        remove,
        success: (m, o) => push(m, { type: "success", ...o }),
        error: (m, o) => push(m, { type: "error", ...o }),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastViewport toasts={toasts} remove={remove} />
        </ToastContext.Provider>
    );
}

// Custom hook for consuming the toast context
export function useToast() {
    // eslint-disable-line
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}

function ToastViewport({ toasts, remove }) {
    return (
        <div className="fixed z-50 top-4 right-4 w-80 space-y-3">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-sm text-sm bg-white transition ${
                        t.type === "success"
                            ? "border-green-200"
                            : t.type === "error"
                            ? "border-red-200"
                            : "border-gray-200"
                    }`}
                >
                    <div
                        className={`w-1.5 rounded-full mt-0.5 ${
                            t.type === "success"
                                ? "bg-green-500"
                                : t.type === "error"
                                ? "bg-red-500"
                                : "bg-blue-500"
                        }`}
                    ></div>
                    <div className="flex-1 text-gray-800 whitespace-pre-line">
                        {t.message}
                    </div>
                    <button
                        onClick={() => remove(t.id)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
