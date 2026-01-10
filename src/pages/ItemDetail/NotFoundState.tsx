import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const NotFoundState = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-zinc-400">Item not found</p>
      </div>
    </Layout>
  );
};
