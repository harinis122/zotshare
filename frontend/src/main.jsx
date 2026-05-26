/*
  main.jsx starts the React app.

  Keep this file tiny:
  index.html -> main.jsx -> App.jsx

  System design picture:
  Browser loads index.html, this file renders App, and App calls api.js
  when the user clicks through the ZotShare happy path.
*/

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
