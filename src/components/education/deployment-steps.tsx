import { DEPLOYMENT_STEPS } from "@/content/levels";

export function DeploymentSteps() {
  return (
    <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {DEPLOYMENT_STEPS.map((step, i) => (
        <li key={step.title} className="border-t-2 border-ink pt-4">
          <span className="text-sm font-semibold text-muted">Bước {i + 1}</span>
          <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
          <p className="mt-2 text-muted">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
