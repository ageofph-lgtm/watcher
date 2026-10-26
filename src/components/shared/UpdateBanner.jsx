import React, { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

function normalizePath(urlStr) {
  if (!urlStr) return "";
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(urlStr, origin);
    return u.pathname;
  } catch {
    return urlStr.startsWith("/") ? urlStr : "/" + urlStr;
  }
}

export default function UpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [remoteHash, setRemoteHash] = useState("");
  const lastCheckRef = useRef(0);

  const checkUpdate = useCallback(async () => {
    lastCheckRef.current = Date.now();
    try {
      const res = await fetch("/index.html?_=" + Date.now(), {
        cache: "no-store",
      });
      if (!res.ok) return;
      const htmlText = await res.text();
      if (!htmlText || typeof htmlText !== "string") return;

      // Extract script module src (/assets/index-*.js)
      const jsMatch = htmlText.match(
        /<script[^>]*\bsrc=["']([^"']*\bassets\/index-[^"']+\.js)["']/i
      );
      if (!jsMatch) return;
      const remoteJs = normalizePath(jsMatch[1]);

      // Extract css href if present (/assets/index-*.css)
      const cssMatch = htmlText.match(
        /<link[^>]*\bhref=["']([^"']*\bassets\/index-[^"']+\.css)["']/i
      );
      const remoteCss = cssMatch ? normalizePath(cssMatch[1]) : "";

      const remoteIdentifier = remoteJs + (remoteCss ? "|" + remoteCss : "");

      // Get currently loaded script and css
      const currentJsElement = document.querySelector(
        'script[type="module"][src*="/assets/"]'
      );
      if (!currentJsElement) return;
      const currentJs = normalizePath(currentJsElement.getAttribute("src"));

      const currentCssElement = document.querySelector(
        'link[rel="stylesheet"][href*="/assets/"]'
      );
      const currentCss = currentCssElement
        ? normalizePath(
            currentCssElement.getAttribute("src") ||
              currentCssElement.getAttribute("href") ||
              ""
          )
        : "";

      const currentIdentifier = currentJs + (currentCss ? "|" + currentCss : "");

      if (remoteIdentifier !== currentIdentifier) {
        const dismissed = sessionStorage.getItem("watcher_update_dismissed");
        if (dismissed !== remoteIdentifier) {
          setHasUpdate(true);
          setRemoteHash(remoteIdentifier);
        }
      }
    } catch {
      // Ignore errors silently
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    checkUpdate();

    // Check every 5 minutes (300,000 ms)
    const intervalId = setInterval(() => {
      checkUpdate();
    }, 5 * 60 * 1000);

    // Check on visibilitychange when passing to visible with 60s throttle
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastCheckRef.current >= 60000) {
          checkUpdate();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkUpdate]);

  const handleDismiss = () => {
    if (remoteHash) {
      sessionStorage.setItem("watcher_update_dismissed", remoteHash);
    }
    setHasUpdate(false);
  };

  if (!hasUpdate) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] p-3 flex items-center gap-3 max-w-sm"
      style={{
        background: "var(--gls2)",
        border: "1px solid var(--bd)",
        boxShadow: "var(--sh)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "rgb(var(--tx))",
        borderRadius: "var(--rl)",
        fontFamily: "var(--fui)",
      }}
    >
      <div className="flex flex-col gap-0.5">
        <span
          className="text-xs font-medium"
          style={{ fontFamily: "var(--fnum)" }}
        >
          Nova versão do Watcher disponível
        </span>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-opacity hover:opacity-90"
          style={{
            background: "rgb(var(--pribg))",
            color: "rgb(var(--pritx))",
            borderRadius: "var(--rm)",
          }}
        >
          Atualizar
        </button>
        <button
          onClick={handleDismiss}
          title="Fechar"
          className="p-1 rounded cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
