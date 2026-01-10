import { Layout } from "@/components/Layout";

export const LoadingState = () => (
  <Layout>
    <div className="container mx-auto p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-32 bg-base-300 rounded" />
        <div className="h-96 bg-base-300 rounded" />
      </div>
    </div>
  </Layout>
);
