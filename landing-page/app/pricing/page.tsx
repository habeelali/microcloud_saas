
import PricingPlans from './pricing-plans';
// page.tsx
export const revalidate = 60;

export default async function PricingPage() {
  let plans = [];

  try {
    const response = await fetch(`https://www.microcloud.tech/api/plans`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    

    if (!response.ok) {
      throw new Error("Failed to fetch plans");
    }

    plans = await response.json();
  } catch (error) {
    console.error("Failed to fetch plans:", error);
  }

  return (
    <div className="min-h-screen py-20 px-4 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 text-white">
          Simple, <span className="text-red-500">Transparent</span> Pricing
        </h1>
        <p className="text-xl text-zinc-400 text-center mb-12">
          Choose the plan that best fits your needs
        </p>
        <PricingPlans plans={plans} />
      </div>
    </div>
  );
}
