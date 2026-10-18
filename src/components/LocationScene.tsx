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
      {pins.map((pin) => (
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
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            width: `${pin.w}%`,
            height: `${pin.h}%`,
            padding: 0,
            overflow: "hidden",
            borderRadius: pin.kind === "npc" ? 12 : 8,
            border:
              pin.kind === "npc"
                ? "1px solid rgba(196,165,116,0.85)"
                : "1px solid rgba(243,235,224,0.35)",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          {pin.image ? (
            <img
              src={pin.image}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: pin.kind === "npc" ? "center 18%" : "center",
                display: "block",
                pointerEvents: "none",
              }}
            />
          ) : null}
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: pin.kind === "npc" ? 10 : "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            <span className={pin.kind === "npc" ? "spark spark-npc" : "spark"} />
          </span>
          <span
            style={{
              position: "absolute",
              left: 4,
              right: 4,
              bottom: 4,
              background: "rgba(12,11,10,0.78)",
              color: "var(--paper)",
              fontSize: 11,
              lineHeight: 1.2,
              borderRadius: 6,
              padding: "2px 4px",
              pointerEvents: "none",
            }}
          >
            {pin.label}
          </span>
        </button>
      ))}
    </div>
  );
}
