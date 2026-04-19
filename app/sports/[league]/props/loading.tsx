import { SportsPropsSurfaceSkeleton } from "@/features/sports/props/SportsPropsSurfaceSkeleton";
import pageStyles from "./page.module.css";

export default function SportsLeaguePropsLoading() {
  return (
    <main className={pageStyles.main}>
      <SportsPropsSurfaceSkeleton />
    </main>
  );
}
