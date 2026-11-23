import { BookOpen, GraduationCap, LifeBuoy, Plane } from "lucide-react";
import { OFFER } from "@/content/education";

const ICONS = { Plane, BookOpen, GraduationCap, LifeBuoy };

export function OfferGrid() {
  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {OFFER.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <li key={item.title}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky">
              <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
            <p className="mt-1 text-muted">{item.text}</p>
          </li>
        );
      })}
    </ul>
  );
}
