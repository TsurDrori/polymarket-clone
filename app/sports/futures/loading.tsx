import { SportsFuturesSurfaceSkeleton } from "@/features/sports/futures/SportsFuturesSurfaceSkeleton";
import pageStyles from "./page.module.css";

export default function SportsFuturesLoading() {
  return (
    <main className={pageStyles.main}>
      <SportsFuturesSurfaceSkeleton cardCount={0} />
    </main>
  );
}
