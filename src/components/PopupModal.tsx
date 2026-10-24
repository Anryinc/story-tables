import type { PopupNotice } from "@/lib/turn-types";

export function PopupModal({
  popup,
  onDismiss,
}: {
  popup: PopupNotice;
  onDismiss: () => void;
}) {
  if (popup.kind === "talk") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(0,0,0,0.72)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div className="card dlg-sheet" style={{ width: "min(520px, 100%)", borderRadius: "18px 18px 0 0" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            {popup.imageUrl ? (
              <img
                src={popup.imageUrl}
                alt=""
                style={{
                  width: 108,
                  height: 180,
                  objectFit: "contain",
                  objectPosition: "center bottom",
                  flex: "0 0 auto",
                }}
              />
            ) : null}
            <div style={{ minWidth: 0, flex: 1, paddingBottom: 8 }}>
              <p className="brass" style={{ fontSize: 11, margin: 0 }}>{popup.title}</p>
              <p className="dlg-line" style={{ color: "var(--paper)", margin: "8px 0 0", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                {popup.body}
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={onDismiss}>
            Дальше
          </button>
        </div>
      </div>
    );
  }

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
          maxHeight: "min(78dvh, 640px)",
          display: "flex",
          flexDirection: "column",
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
              maxHeight: 160,
              objectFit: "cover",
              borderRadius: 12,
              marginBottom: 10,
              flex: "0 0 auto",
            }}
          />
        ) : null}
        <div style={{ overflowY: "auto", minHeight: 0, flex: "1 1 auto", paddingRight: 4 }}>
          <p className="muted" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {popup.body}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 16, flex: "0 0 auto" }}
          onClick={onDismiss}
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
