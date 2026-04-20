import Image from "next/image";
import { getEventImage } from "@/features/events/api/parse";
import type { PolymarketEvent } from "@/features/events/types";
import { formatEndDate, formatFullUSD } from "@/shared/lib/format";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import styles from "./EventHeader.module.css";

type EventHeaderProps = {
  event: PolymarketEvent;
};

export function EventHeader({ event }: EventHeaderProps) {
  const imageSrc = getEventImage(event) ?? "/placeholder.svg";
  const endDate = event.endDate ? formatEndDate(event.endDate) : "";
  const meta = `${formatFullUSD(event.volume)} Vol.${endDate ? ` · ${endDate}` : ""}`;

  return (
    <header className={styles.header}>
      <div className={styles.imageWrap}>
        <Image
          src={imageSrc}
          alt={event.title}
          width={80}
          height={80}
          sizes="80px"
          unoptimized={shouldBypassNextImageOptimization(imageSrc)}
          className={styles.image}
        />
      </div>

      <div className={styles.copy}>
        <h1 className={styles.title}>{event.title}</h1>
        <p className={styles.meta}>{meta}</p>
      </div>
    </header>
  );
}
