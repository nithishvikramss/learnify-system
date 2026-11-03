export default function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="field-error" role="alert">{message}</div>;
}
