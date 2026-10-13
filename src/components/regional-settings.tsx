"use client";

import { useEffect, useState } from "react";

const EURO_COUNTRIES = new Set(["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"]);
const CURRENCIES: Record<string, string> = {
  AE: "AED", AU: "AUD", BR: "BRL", CA: "CAD", CH: "CHF", CN: "CNY", CZ: "CZK", DK: "DKK",
  GB: "GBP", HK: "HKD", HU: "HUF", IL: "ILS", IN: "INR", JP: "JPY", KR: "KRW", MX: "MXN",
  NO: "NOK", NZ: "NZD", PL: "PLN", RO: "RON", SA: "SAR", SE: "SEK", SG: "SGD", TR: "TRY",
  US: "USD", ZA: "ZAR",
};

function browserCountry() {
  try {
    return new Intl.Locale(navigator.language).maximize().region ?? "CA";
  } catch {
    return "CA";
  }
}

function regionalLabel(country: string) {
  const normalizedCountry = /^[A-Z]{2}$/.test(country) ? country : "CA";
  const currency = EURO_COUNTRIES.has(normalizedCountry) ? "EUR" : CURRENCIES[normalizedCountry] ?? "CAD";
  try {
    const name = new Intl.DisplayNames([navigator.language], { type: "region" }).of(normalizedCountry);
    return `${name ?? normalizedCountry} / ${currency}`;
  } catch {
    return `${normalizedCountry} / ${currency}`;
  }
}

export function RegionalSettings() {
  const [label, setLabel] = useState("Canada / CAD");

  useEffect(() => {
    let active = true;
    fetch("/api/region", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ country: string | null }> : Promise.reject())
      .then(({ country }) => { if (active) setLabel(regionalLabel(country ?? browserCountry())); })
      .catch(() => { if (active) setLabel(regionalLabel(browserCountry())); });
    return () => { active = false; };
  }, []);

  return <p title="Local currency is applied at secure checkout where supported">{label}</p>;
}
