import { Container } from "react-bootstrap";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", backgroundColor: "var(--rg-light)" }}
    >
      <Container style={{ maxWidth: 440 }}>{children}</Container>
    </div>
  );
}
