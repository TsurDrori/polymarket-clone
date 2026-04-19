import { permanentRedirect } from "next/navigation";

export default function SportsPage() {
  permanentRedirect("/sports/live");
}
