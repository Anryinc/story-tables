import type { PopupNotice } from "@/lib/turn-types";

export function PopupModal({
  popup,
  onDismiss,
}: {
  popup: PopupNotice;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 360,
          width: "100%",
          borderColor: "var(--brass)",
          background: "#141210",
        }}
      >
        <p className="brass" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          Раунд {popup.round}
        </p>
        <h2 className="font-display" style={{ color: "var(--paper)", margin: "8px 0" }}>
          {popup.title}
        </h2>
        {popup.imageUrl ? (
          <img
            src={popup.imageUrl}
            alt=""
            style={{
              width: "100%",
              maxHeight: 220,
              objectFit: "cover",
              borderRadius: 12,
              marginBottom: 10,
            }}
          />
        ) : null}
        <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
          {popup.body}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 16 }}
          onClick={onDismiss}
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
