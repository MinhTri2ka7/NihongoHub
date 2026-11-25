export function FormMessage({ message, success = false }: { message: string; success?: boolean }) {
  if (!message) return null;
  return <div className={`form-message ${success ? 'message-success' : 'message-error'}`} role={success ? 'status' : 'alert'}>{message}</div>;
}
