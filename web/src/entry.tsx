import { createRoot } from "react-dom/client";
import { Main } from "./Screen";
import "./styles.css";
import "./theme.css";

createRoot(document.getElementById("root")!).render(<Main />);
