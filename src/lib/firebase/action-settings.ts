"use client";

export function emailActionSettings(returnPath = "/login") {
  return { url: `${window.location.origin}${returnPath}`, handleCodeInApp: false };
}
