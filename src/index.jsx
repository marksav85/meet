import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { register } from "./serviceWorkerRegistration";
import { prepareAuthentication } from "./api";

// Consume the callback before rendering or registering the offline shell.
prepareAuthentication();
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
register();
