import { SportsFuturesSurfaceSkeleton } from "@/features/sports/futures/SportsFuturesSurfaceSkeleton";
import pageStyles from "./page.module.css";

export default function SportsLeagueFuturesLoading() {
  return (
    <main className={pageStyles.main}>
      <SportsFuturesSurfaceSkeleton />
    </main>
  );
}
