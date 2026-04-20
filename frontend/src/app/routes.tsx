import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { TrainingLab } from "./pages/TrainingLab";
import { Analytics } from "./pages/Analytics";
import { LiveDemo } from "./pages/LiveDemo";
import { Architecture } from "./pages/Architecture";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "architecture", Component: Architecture },
      { path: "training-lab", Component: TrainingLab },
      { path: "analytics", Component: Analytics },
      { path: "live-demo", Component: LiveDemo },
      { path: "*", Component: NotFound },
    ],
  },
]);
