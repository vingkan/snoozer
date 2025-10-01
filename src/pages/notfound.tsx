import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-4xl font-bold">Not Found</h1>
      <p className="text-lg">The page you are looking for does not exist.</p>
      <Button onClick={() => navigate("/")}>Go home</Button>
    </div>
  );
}
