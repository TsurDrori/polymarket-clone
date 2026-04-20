import type { ReactNode } from "react";

type RouteFeedbackProps = {
  title: string;
  message: string;
  children?: ReactNode;
  role?: "alert";
};

export function RouteFeedback({
  title,
  message,
  children,
  role,
}: RouteFeedbackProps) {
  return (
    <main className="route-feedback">
      <div role={role} className="route-feedback__card">
        <h1 className="route-feedback__title">{title}</h1>
        <p className="route-feedback__message">{message}</p>
        {children ? <div className="route-feedback__actions">{children}</div> : null}
      </div>
    </main>
  );
}
