"use client";
import { useEffect, useState } from "react";

const Loading = ({ duration = 2000, onDone }: { duration?: number; onDone?: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onDone?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone]);

  if (!show) return null;

  return (
    <div className="text-center flex flex-col items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500 mx-auto" />
    <h2 className="text-zinc-900 dark:text-white mt-4">Loading...</h2>
    <p className="text-zinc-600 dark:text-zinc-400">
        Vui lòng chờ một chút...
    </p>
    </div>
  );
};

export default Loading;
