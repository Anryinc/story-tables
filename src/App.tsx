import { Navigate, Route, Routes } from "react-router-dom";
import { HubPage } from "./pages/HubPage";
import { PlayPage } from "./pages/PlayPage";
import { ProjectPage } from "./pages/ProjectPage";
import { StudioPage } from "./pages/StudioPage";
import { TablePage } from "./pages/TablePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HubPage />} />
      <Route path="/project/:projectId" element={<ProjectPage />} />
      <Route path="/table/:code" element={<TablePage />} />
      <Route path="/play/:code" element={<PlayPage />} />
      <Route path="/studio/:projectId" element={<StudioPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
