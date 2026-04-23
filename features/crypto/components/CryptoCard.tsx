import { BinaryGroupCard } from "@/features/market-cards/components/BinaryGroupCard";
import { BinaryWidgetCard } from "@/features/market-cards/components/BinaryWidgetCard";
import { type CryptoCardModel } from "../parse";

type CryptoCardProps = {
  card: CryptoCardModel;
  emphasis?: {
    isLiveLeader?: boolean;
    isPromoted?: boolean;
  };
};

export function CryptoCard({ card, emphasis }: CryptoCardProps) {
  if (card.variant === "list") {
    return (
      <BinaryGroupCard
        title={card.title}
        href={`/event/${card.slug}`}
        imageSrc={card.imageSrc}
        rows={card.snippets.map((snippet) => ({
          id: snippet.id,
          label: snippet.label,
          probabilityTokenId: snippet.tokenId ?? undefined,
          probabilityFallback: snippet.fallbackPrice,
          actions: [
            {
              label: snippet.primaryOutcomeLabel,
              tone: "yes" as const,
              tokenId: snippet.tokenId ?? undefined,
              fallbackPrice: snippet.fallbackPrice,
            },
            {
              label: snippet.secondaryOutcomeLabel,
              tone: "no" as const,
              tokenId: snippet.secondaryTokenId ?? undefined,
              fallbackPrice: snippet.secondaryFallbackPrice,
            },
          ],
        }))}
        volumeLabel={card.volumeLabel}
        metaLabel={card.metaLabel}
        showLiveDot={card.showLiveDot}
        emphasis={emphasis}
      />
    );
  }

  const singleLabel =
    card.family === "up-down"
      ? card.primarySnippet.primaryOutcomeLabel
      : card.primarySnippet.primaryOutcomeLabel === "Yes"
        ? "Chance"
        : card.primarySnippet.primaryOutcomeLabel;

  return (
    <BinaryWidgetCard
      title={card.title}
      href={`/event/${card.slug}`}
      imageSrc={card.imageSrc}
      probability={{
        label: singleLabel,
        price: card.primarySnippet.fallbackPrice,
        tokenId: card.primarySnippet.tokenId ?? undefined,
      }}
      actions={[
        {
          label: card.primarySnippet.primaryOutcomeLabel,
          tone: "yes",
          tokenId: card.primarySnippet.tokenId ?? undefined,
          fallbackPrice: card.primarySnippet.fallbackPrice,
        },
        {
          label: card.primarySnippet.secondaryOutcomeLabel,
          tone: "no",
          tokenId: card.primarySnippet.secondaryTokenId ?? undefined,
          fallbackPrice: card.primarySnippet.secondaryFallbackPrice,
        },
      ]}
      showLiveDot={card.showLiveDot}
      liveLabel="LIVE"
      footerTrailing={card.metaLabel ?? undefined}
      emphasis={emphasis}
    />
  );
}
