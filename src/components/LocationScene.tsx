import type { SceneHotspot } from "@/lib/turn-types";

export function LocationScene({
  image,
  title,
  hotspots,
  onInspect,
  onTalk,
}: {
  image?: string | null;
  title?: string | null;
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
      {title ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "10px 14px 28px",
            background: "linear-gradient(to bottom, rgba(8,7,6,0.86), rgba(8,7,6,0))",
            color: "var(--paper)",
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 28,
            lineHeight: 1.1,
            pointerEvents: "none",
          }}
        >
          {title}
        </div>
      ) : null}
      {pins.map((pin) => {
        if (pin.kind === "npc") {
          return (
            <button
              key={pin.id}
              type="button"
              aria-label={pin.label}
              onClick={() => onTalk(pin)}
              style={{
                position: "absolute",
                left: `${pin.x}%`,
                top: `${pin.y}%`,
                width: `${pin.w}%`,
                height: `${pin.h}%`,
                padding: 0,
                border: "none",
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
                    objectFit: "contain",
                    objectPosition: "center bottom",
                    display: "block",
                    pointerEvents: "none",
                  }}
                />
              ) : null}
            </button>
          );
        }
        const cx = pin.x + pin.w / 2;
        const cy = pin.y + pin.h / 2;
        return (
          <button
            key={pin.id}
            type="button"
            aria-label={pin.label}
            onClick={() => {
              if (pin.inspectId) onInspect(pin.inspectId);
            }}
            style={{
              position: "absolute",
              left: `${cx}%`,
              top: `${cy}%`,
              width: 56,
              height: 56,
              transform: "translate(-50%, -50%)",
              padding: 0,
              border: "none",
              background: "transparent",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <span className="spark" />
          </button>
        );
      })}
    </div>
  );
}
