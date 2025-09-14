/* script.js
   - Replace API_KEY with your OpenWeatherMap API key.
   - Save all three files in same folder and open index.html in browser.
*/

const API_KEY = "e018b5c585de98c0b24b55acfd87b9bb"; // <-- put your OpenWeatherMap API key here

// DOM
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const metricBtn = document.getElementById("metricBtn");

const messageEl = document.getElementById("message");
const currentEl = document.getElementById("current");
const iconEl = document.getElementById("icon");
const placeEl = document.getElementById("place");
const descEl = document.getElementById("desc");
const tempEl = document.getElementById("temp");
const feelsEl = document.getElementById("feels");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

const bigTemp = document.getElementById("bigTemp");
const bigDesc = document.getElementById("bigDesc");
const timeLocal = document.getElementById("timeLocal");

let units = "metric"; // metric or imperial

function showMessage(text, isError = true) {
  messageEl.textContent = text || "";
  messageEl.style.color = isError ? "crimson" : "#0f5132";
}

function showLoading() {
  document.getElementById("loading").classList.remove("d-none");
}

function hideLoading() {
  document.getElementById("loading").classList.add("d-none");
}

/* Build icon url */
function iconUrl(icon) {
  return `https://openweathermap.org/img/wn/${icon}@4x.png`;
}

/* Format temperature with unit */
function formatTemp(v) {
  if (v === undefined || v === null) return "—";
  return `${Math.round(v)}°${units === "metric" ? "C" : "F"}`;
}

/* Update UI with weather data (OpenWeatherMap current weather response) */
function updateUI(data) {
  if (!data) return;
  currentEl.classList.remove("d-none");
  const placeStr = `${data.name}, ${data.sys?.country || ""}`;
  placeEl.textContent = placeStr;
  descEl.textContent = data.weather?.[0]?.description || "";
  iconEl.src = iconUrl(data.weather?.[0]?.icon || "01d");
  iconEl.alt = data.weather?.[0]?.description || "weather";

  tempEl.textContent = formatTemp(data.main.temp);
  feelsEl.textContent = formatTemp(data.main.feels_like);
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${data.wind.speed} ${units === "metric" ? "m/s" : "mph"}`;

  bigTemp.textContent = `${Math.round(data.main.temp)}°`;
  bigDesc.textContent = data.weather?.[0]?.main || "";

  // Calculate local time using data.dt (UTC timestamp) and data.timezone (offset in seconds)
  if (data.dt && data.timezone !== undefined) {
    const localTime = new Date((data.dt + data.timezone) * 1000);
    timeLocal.textContent = `Local time: ${localTime.toLocaleString()}`;
  } else {
    timeLocal.textContent = `Local time: —`;
  }

  showMessage("", false);
}

/* Fetch weather by city name */
async function fetchByCity(city) {
  if (!city) {
    showMessage("Enter a city name");
    return;
  }
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    showMessage("Please set your API key in script.js");
    return;
  }

  showLoading();
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`);
    if (!res.ok) throw new Error("City not found");
    const data = await res.json();
    updateUI(data);
    hideLoading();
  } catch (err) {
    console.error(err);
    showMessage(err.message || "Failed to load weather");
    hideLoading();
  }
}

/* Fetch weather by coords (lat, lon) */
async function fetchByCoords(lat, lon) {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    showMessage("Please set your API key in script.js");
    return;
  }
  showLoading();
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
    if (!res.ok) throw new Error("Location weather not available");
    const data = await res.json();
    updateUI(data);
    hideLoading();
  } catch (err) {
    console.error(err);
    showMessage(err.message || "Failed to load weather");
    hideLoading();
  }
}

/* Try browser geolocation with graceful fallback */
function tryGeolocation() {
  if (!("geolocation" in navigator)) {
    showMessage("Geolocation not supported — please search a city.");
    return;
  }
  showMessage("Attempting to get your location...", false);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetchByCoords(latitude, longitude);
    },
    async (err) => {
      console.warn("Geolocation error", err);
      // If denied or unavailable, try an IP-based fallback (best-effort)
      try {
        const r = await fetch("https://ipapi.co/json/");
        if (!r.ok) throw new Error("IP lookup failed");
        const data = await r.json();
        if (data && (data.latitude || data.latitude === 0) && (data.longitude || data.longitude === 0)) {
          fetchByCoords(data.latitude, data.longitude);
          showMessage("Using approximate location from IP (permission blocked).", false);
        } else if (data && data.city) {
          fetchByCity(data.city);
          showMessage("Using approximate location from IP.", false);
        } else {
          fetchByCity("Delhi");
          showMessage("Could not get location — showing Delhi.", false);
        }
      } catch (ipErr) {
        console.error(ipErr);
        // final fallback to Delhi
        fetchByCity("Delhi");
        showMessage("Could not get location — showing Delhi.", false);
      }
    },
    { timeout: 10000 }
  );
}

/* Event listeners */
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  fetchByCity(cityInput.value.trim());
});

locBtn.addEventListener("click", () => {
  tryGeolocation();
});

metricBtn.addEventListener("click", () => {
  units = units === "metric" ? "imperial" : "metric";
  metricBtn.textContent = units === "metric" ? "°C / °F" : "°F / °C";
  // re-fetch current place if visible
  const place = placeEl.textContent.split(",")[0];
  if (place && place !== "—") fetchByCity(place);
});

/* Auto-run on load */
window.addEventListener("load", () => {
  tryGeolocation();
});
