import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-4xl font-bold">Snoozer</h1>
      <p className="text-lg text-muted-foreground">
        Fantasy Football Analytics
      </p>
      <div className="flex gap-4">
        <Link to="/example">
          <Button variant="outline">Running Backs Analysis</Button>
        </Link>
        <Link to="/wide-receivers">
          <Button variant="outline">Wide Receivers Analysis</Button>
        </Link>
        <Link to="/defense">
          <Button variant="outline">Defense Evaluation</Button>
        </Link>
      </div>
    </div>
  );
}
