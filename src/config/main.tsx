import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import MyColors from "../ts/MyColors.tsx";

const params = new URLSearchParams(window.location.search);
const view = params.get("view");

const Root = view === "my-colors" ? MyColors : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
