import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useA11y } from "@/lib/a11y";
import { validateEvaluation, VISITOR_LABEL, type EvaluationResponse } from "@/lib/sonification-spec";
import { cn } from "@/lib/utils";

type Draft = Partial<EvaluationResponse>;

const COMPREHENSION: { v: EvaluationResponse["comprehension"]; label: string }[] = [
  { v: "yes", label: "Yes" },
  { v: "partially", label: "A little" },
  { v: "no", label: "Not yet" },
];
const TRUST: { v: EvaluationResponse["scientificTrust"]; label: string }[] = [
  { v: "high", label: "A lot" },
  { v: "moderate", label: "Somewhat" },
  { v: "low", label: "Not much" },
];

function Choice<T extends string | number>({ name, legend, options, value, onPick }: {
  name: string; legend: string; options: { v: T; label: string }[]; value?: T; onPick: (v: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-lg font-bold">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            name={name}
            onClick={() => onPick(o.v)}
            className={cn(
              "min-h-12 rounded-2xl border-2 px-4 text-base font-bold transition-colors",
              value === o.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Visitor feedback card based on the "A Universe of Sound" evaluation questions. Answers stay on this device. */
export function EvaluationForm() {
  const { announce } = useA11y();
  const [d, setD] = useState<Draft>({});
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  const submit = () => {
    const ok = validateEvaluation(d as EvaluationResponse);
    if (!ok) {
      setStatus("error");
      announce("Please answer all four questions first.");
      return;
    }
    try {
      const prev = JSON.parse(localStorage.getItem("ej-feedback") ?? "[]");
      localStorage.setItem("ej-feedback", JSON.stringify([...prev, { ...d, at: new Date().toISOString() }]));
    } catch { /* storage unavailable */ }
    setStatus("sent");
    announce("Thank you! Your answers were saved.");
  };

  return (
    <section aria-labelledby="eval-title" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="surface p-6 sm:p-10">
        <h2 id="eval-title" className="font-display text-4xl font-bold">Tell us how it sounded</h2>
        <p className="mt-2 text-lg text-muted-foreground">Four quick questions, inspired by the “A Universe of Sound” study. Answers stay on this device.</p>
        {status === "sent" ? (
          <div role="status" className="mt-6 space-y-4">
            <p className="text-2xl font-bold text-primary">Thank you, explorer! Your answers were saved.</p>
            <Button size="lg" variant="soft" onClick={() => { setD({}); setStatus("idle"); }}>Answer again</Button>
          </div>
        ) : (
          <form className="mt-6 grid gap-6 lg:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <fieldset className="min-w-0">
              <legend className="mb-3 text-lg font-bold">How much did you enjoy it?</legend>
              <div role="radiogroup" aria-label="Enjoyment, 1 to 5 stars" className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={d.enjoymentRating === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setD({ ...d, enjoymentRating: n })}
                    className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-border bg-card hover:border-primary aria-checked:border-primary"
                  >
                    <Star aria-hidden="true" className={cn("h-7 w-7", (d.enjoymentRating ?? 0) >= n ? "fill-primary text-primary" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
            </fieldset>
            <Choice name="comp" legend="Did you understand what the sounds meant?" options={COMPREHENSION} value={d.comprehension} onPick={(v) => setD({ ...d, comprehension: v })} />
            <Choice name="trust" legend="Do you trust that the sounds show real NASA data?" options={TRUST} value={d.scientificTrust} onPick={(v) => setD({ ...d, scientificTrust: v })} />
            <Choice name="who" legend="Who is answering?" options={(Object.keys(VISITOR_LABEL) as EvaluationResponse["visitorProfile"][]).map((v) => ({ v, label: VISITOR_LABEL[v] }))} value={d.visitorProfile} onPick={(v) => setD({ ...d, visitorProfile: v })} />
            <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
              <Button type="submit" size="xl" variant="hero">Send my answers</Button>
              {status === "error" && <p role="alert" className="text-lg font-bold text-destructive">Please answer all four questions first.</p>}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
