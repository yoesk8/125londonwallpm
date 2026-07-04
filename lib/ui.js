// Design tokens + tiny UI atoms shared across views
export const C = {
  bg: "#12161D",
  panel: "#1B222C",
  panel2: "#222B37",
  line: "#2E3947",
  text: "#E8ECF1",
  dim: "#8A96A5",
  hivis: "#FF6B1A",
  done: "#2ECC71",
  progress: "#FFB020",
  pending: "#46536A",
  danger: "#FF4D4D",
};

export const TRADES = ["Cladding", "Windows", "Mastic", "Granite"];
export const STATUS_ORDER = ["pending", "progress", "done"];
export const STATUS_LABEL = { pending: "Not started", progress: "In progress", done: "Complete" };
export const STATUS_COLOR = { pending: C.pending, progress: C.progress, done: C.done };

export const inputStyle = {
  background: C.bg,
  border: `1px solid ${C.line}`,
  color: C.text,
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 14,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export function Btn({ children, onClick, kind = "solid", small, disabled, style, type = "button" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background: kind === "solid" ? C.hivis : "transparent",
      color: kind === "solid" ? "#16100B" : kind === "danger" ? C.danger : C.text,
      border: kind === "solid" ? "none" : `1px solid ${kind === "danger" ? C.danger : C.line}`,
      borderRadius: 6,
      padding: small ? "5px 10px" : "10px 16px",
      fontSize: small ? 12 : 14,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      fontFamily: "inherit",
      letterSpacing: 0.2,
      ...style,
    }}>{children}</button>
  );
}

export function Tag({ status }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
      color: status === "pending" ? C.dim : "#0F1216",
      background: STATUS_COLOR[status], borderRadius: 99, padding: "3px 10px",
      textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap",
    }}>{STATUS_LABEL[status]}</span>
  );
}
