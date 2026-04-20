import Link from "next/link";
import { RouteFeedback } from "@/shared/ui/RouteFeedback";

export default function EventNotFound() {
  return (
    <RouteFeedback
      title="Market not found"
      message="This event slug doesn&apos;t exist or is no longer available from the Gamma feed."
    >
        <Link href="/" className="route-feedback__action">
          Back to trending markets
        </Link>
    </RouteFeedback>
  );
}
