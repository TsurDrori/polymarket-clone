import Link from "next/link";
import {
  SPORTS_FUTURES_FAQ,
  SPORTS_FUTURES_NEW_MARKETS,
  SPORTS_FUTURES_POPULAR_MARKETS,
  SPORTS_FUTURES_RELATED_TOPICS,
  type SportsFuturesLinkItem,
} from "./discoveryContent";
import styles from "./SportsFuturesDiscovery.module.css";

type SportsFuturesDiscoveryColumn = {
  title: string;
  links: ReadonlyArray<SportsFuturesLinkItem>;
};

type SportsFuturesDiscoveryContent = {
  relatedTopics: SportsFuturesDiscoveryColumn;
  popularMarkets: SportsFuturesDiscoveryColumn;
  newMarkets: SportsFuturesDiscoveryColumn;
};

type SportsFuturesDiscoveryProps = {
  brandLabel?: string;
  brandTitle?: string;
  brandCopy?: string;
  content?: SportsFuturesDiscoveryContent;
};

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<SportsFuturesLinkItem>;
}) {
  return (
    <section className={styles.column} aria-labelledby={`futures-discovery-${title}`}>
      <h3 className={styles.columnTitle} id={`futures-discovery-${title}`}>
        {title}
      </h3>
      <ul className={styles.linkList}>
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link href={link.href} className={styles.link}>
              <span>{link.label}</span>
              {link.sublabel ? <span className={styles.sublabel}>{link.sublabel}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const DEFAULT_DISCOVERY_CONTENT: SportsFuturesDiscoveryContent = {
  relatedTopics: {
    title: "Related topics",
    links: SPORTS_FUTURES_RELATED_TOPICS,
  },
  popularMarkets: {
    title: "Popular futures markets",
    links: SPORTS_FUTURES_POPULAR_MARKETS,
  },
  newMarkets: {
    title: "New futures markets",
    links: SPORTS_FUTURES_NEW_MARKETS,
  },
};

export function SportsFuturesDiscovery({
  brandLabel = "Polymarket",
  brandTitle = "The World's Largest Prediction Market",
  brandCopy = "Live Polymarket pairs an empty aggregate futures feed with discovery sections that keep the route useful, so this surface mirrors that same lower-page structure.",
  content = DEFAULT_DISCOVERY_CONTENT,
}: SportsFuturesDiscoveryProps) {
  return (
    <div className={styles.wrap}>
      <section className={styles.faqSection} aria-labelledby="sports-futures-faq">
        <h2 className={styles.sectionTitle} id="sports-futures-faq">
          Frequently Asked Questions
        </h2>
        <div className={styles.faqList}>
          {SPORTS_FUTURES_FAQ.map((item) => (
            <details key={item.question} className={styles.faqItem}>
              <summary className={styles.faqToggle}>{item.question}</summary>
              <p className={styles.faqAnswer}>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.linkShell} aria-labelledby="sports-futures-discovery">
        <div className={styles.brand}>
          <p className={styles.brandLabel}>{brandLabel}</p>
          <h2 className={styles.brandTitle} id="sports-futures-discovery">
            {brandTitle}
          </h2>
          <p className={styles.brandCopy}>{brandCopy}</p>
        </div>

        <div className={styles.columns}>
          <LinkColumn
            title={content.relatedTopics.title}
            links={content.relatedTopics.links}
          />
          <LinkColumn
            title={content.popularMarkets.title}
            links={content.popularMarkets.links}
          />
          <LinkColumn
            title={content.newMarkets.title}
            links={content.newMarkets.links}
          />
        </div>
      </section>
    </div>
  );
}
