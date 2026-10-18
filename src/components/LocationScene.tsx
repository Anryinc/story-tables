import type { SceneHotspot } from "@/lib/turn-types";

export function LocationScene({
  image,
  hotspots,
  disabled,
  onInspect,
}: {
  image?: string | null;
  hotspots?: SceneHotspot[];
  disabled?: boolean;
  onInspect: (inspectId: string) => void;
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
          disabled={disabled || pin.kind !== "inspect" || !pin.inspectId}
          onClick={() => {
            if (pin.inspectId) onInspect(pin.inspectId);
          }}
          style={{
            position: "absolute",
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            width: `${pin.w}%`,
            height: `${pin.h}%`,
            padding: 0,
            overflow: "hidden",
            borderRadius: pin.kind === "npc" ? 10 : 8,
            border:
              pin.kind === "npc"
                ? "1px solid rgba(196,165,116,0.85)"
                : "1px dashed rgba(243,235,224,0.7)",
            background: "transparent",
            cursor: pin.kind === "inspect" && !disabled ? "pointer" : "default",
          }}
        >
          {pin.kind === "npc" && pin.image ? (
            <img
              src={pin.image}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 18%",
                display: "block",
              }}
            />
          ) : null}
          {pin.kind === "inspect" && pin.image ? (
            <img
              src={pin.image}
              alt=""
              style={{
                position: "absolute",
                top: 4,
                left: 4,
                width: 34,
                height: 34,
                objectFit: "cover",
                borderRadius: 6,
                border: "1px solid var(--brass)",
              }}
            />
          ) : null}
          <span
            style={{
              position: "absolute",
              left: 4,
              right: 4,
              bottom: 4,
              background: "rgba(12,11,10,0.82)",
              color: "var(--paper)",
              fontSize: 11,
              lineHeight: 1.2,
              borderRadius: 6,
              padding: "3px 4px",
            }}
          >
            {pin.label}
          </span>
        </button>
      ))}
    </div>
  );
}
