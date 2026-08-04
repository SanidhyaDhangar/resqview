export default function Toasts({ toasts }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id} style={{ "--sevc": toast.color }}>
          <span aria-hidden="true">{toast.icon}</span>
          <span>{toast.title}</span>
          {toast.detail && <span className="tc">{toast.detail}</span>}
        </div>
      ))}
    </div>
  );
}
