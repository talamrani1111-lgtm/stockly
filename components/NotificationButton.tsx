"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

type Status = "unsupported" | "denied" | "default" | "subscribed" | "loading";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function NotificationButton() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") { setStatus("denied"); return; }

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : perm === "granted" ? "default" : "default");
    }).catch(() => setStatus("default"));
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  async function enable() {
    setStatus("loading");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus("denied"); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
      setStatus("subscribed");

      await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Stockly ✅", body: "התראות הופעלו בהצלחה!" }),
      });
    } catch {
      setStatus("default");
    }
  }

  async function disable() {
    setStatus("loading");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await fetch("/api/push/subscribe", { method: "DELETE" });
    setStatus("default");
  }

  if (status === "unsupported") return null;

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div title="התראות חסומות בדפדפן"
        className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 cursor-not-allowed">
        <BellOff size={13} />
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <button onClick={disable} title="בטל התראות"
        className="w-8 h-8 rounded-xl bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent hover:bg-brand-accent/30 transition-all">
        <BellRing size={13} />
      </button>
    );
  }

  return (
    <button onClick={enable} title="הפעל התראות לטלפון"
      className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
      <Bell size={13} />
    </button>
  );
}
