import type { SceneHotspot } from "@/lib/turn-types";

export function LocationScene({
  image,
  hotspots,
  onInspect,
  onTalk,
}: {
  image?: string | null;
  hotspots?: SceneHotspot[];
  onInspect: (inspectId: string) => void;
  onTalk: (pin: SceneHotspot) => void;
}) {
  const pins = hotspots ?? [];
  if (!image && pins.length === 0) return null;
  return (
    <div
      style={{
        position: "relative",
        marginTop: 12,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--line)",
        aspectRatio: "16 / 9",
        background: "#14110e",
      }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : null}
      {pins.map((pin) => {
        const cx = pin.x + pin.w / 2;
        const cy = pin.y + pin.h / 2;
        return (
          <button
            key={pin.id}
            type="button"
            aria-label={pin.label}
            onClick={() => {
              if (pin.kind === "inspect" && pin.inspectId) onInspect(pin.inspectId);
              else onTalk(pin);
            }}
            style={{
              position: "absolute",
              left: `${cx}%`,
              top: `${cy}%`,
              width: 48,
              height: 48,
              transform: "translate(-50%, -50%)",
              padding: 0,
              border: "none",
              background: "transparent",
              display: "grid",
              placeItems: "center",
            }}
          >
            <span className={pin.kind === "npc" ? "spark spark-npc" : "spark"} />
          </button>
        );
      })}
    </div>
  );
}
