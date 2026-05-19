import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect,
} from "react";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timeoutsRef = useRef({});

    useEffect(() => {
        return () => {
            Object.values(timeoutsRef.current).forEach(clearTimeout);
            timeoutsRef.current = {};
        };
    }, []);

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
            setToasts((current) => {
                const next = [...current, toast];
                const overflow = Math.max(0, next.length - 3);
                if (overflow > 0) {
                    next.slice(0, overflow).forEach((oldToast) => {
                        if (timeoutsRef.current[oldToast.id]) {
                            clearTimeout(timeoutsRef.current[oldToast.id]);
                            delete timeoutsRef.current[oldToast.id];
                        }
                    });
                }
                return next.slice(overflow);
            });
            if (duration > 0) {
                timeoutsRef.current[id] = setTimeout(
                    () => remove(id),
                    duration,
                );
            }
            return id;
        },
        [remove],
    );

    const value = {
        toasts,
        push,
        remove,
        success: (m, o) => push(m, { type: "success", ...o }),
        error: (m, o) => push(m, { type: "error", ...o }),
        info: (m, o) => push(m, { type: "info", ...o }),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastViewport toasts={toasts} remove={remove} />
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}

function ToastViewport({ toasts, remove }) {
    return (
        <div
            className="fixed z-50 top-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 space-y-3"
            aria-live="polite"
            aria-relevant="additions removals"
        >
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
