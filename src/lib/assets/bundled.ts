import type { AssetCategory } from "./store";

/** Pictures shipped with the app. They live in /public and are registered into the asset library. */
export type BundledAsset = {
  id: string;
  name: string;
  url: string;
  category: AssetCategory;
};

export const BUNDLED_ASSETS: BundledAsset[] = [
  { id: "bundled_tb_cover", name: "bg_обложка", url: "/third-bell/cover.jpg", category: "background" },
  { id: "bundled_tb_platform", name: "bg_платформа", url: "/third-bell/platform.jpg", category: "background" },
  { id: "bundled_tb_hall", name: "bg_зал", url: "/third-bell/hall.jpg", category: "background" },
  { id: "bundled_tb_office", name: "bg_касса", url: "/third-bell/office.jpg", category: "background" },
  { id: "bundled_tb_ida", name: "npc_ида", url: "/third-bell/ida.png", category: "npc" },
  { id: "bundled_portrait_m", name: "npc_силуэт_м", url: "/portraits/male.jpg", category: "npc" },
  { id: "bundled_portrait_f", name: "npc_силуэт_ж", url: "/portraits/female.jpg", category: "npc" },
  { id: "bundled_tb_puddle", name: "item_лужи", url: "/third-bell/puddle.jpg", category: "item" },
  { id: "bundled_tb_board", name: "item_табло", url: "/third-bell/board.jpg", category: "item" },
  { id: "bundled_tb_clock", name: "item_часы", url: "/third-bell/clock.jpg", category: "item" },
  { id: "bundled_tb_ledger", name: "item_журнал", url: "/third-bell/ledger.jpg", category: "item" },
  { id: "bundled_tb_drawer", name: "item_ящик", url: "/third-bell/drawer.jpg", category: "item" },
  { id: "bundled_tb_glass", name: "item_стекло", url: "/third-bell/glass.jpg", category: "item" },
];
