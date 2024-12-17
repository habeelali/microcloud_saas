import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

interface Plan {
  name: string;
  vcpu: number;
  memory: number;
  storage: number;
  bandwidth: number;
  price: number;
}

interface PricingPlansProps {
  plans: Plan[];
}

export default function PricingPlans({ plans }: PricingPlansProps) {
  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <Card className="bg-zinc-900 border-zinc-800 max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-white">No Plans Available</CardTitle>
            <CardDescription className="text-zinc-400">
              Our pricing plans are currently being updated. Please check back later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              className="border-zinc-700 text-zinc-500 cursor-not-allowed"
              disabled
            >
              Order Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-6 gap-8 mb-12">
        {plans.map((plan, index) => (
          <Card
            key={index} // Use index as the key since `id` is missing
            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors duration-300"
          >
            <CardHeader>
              <CardTitle className="text-white">{plan.name}</CardTitle>
              <CardDescription className="text-zinc-400"></CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">${plan.price}</span>
                <span className="text-zinc-400">/month</span>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center text-zinc-300">
                  <Check className="h-5 w-5 mr-3 text-red-500" />
                  {plan.vcpu} vCPU Cores
                </li>
                <li className="flex items-center text-zinc-300">
                  <Check className="h-5 w-5 mr-3 text-red-500" />
                  {(plan.memory / 1024).toFixed(1)} GB RAM
                </li>
                <li className="flex items-center text-zinc-300">
                  <Check className="h-5 w-5 mr-3 text-red-500" />
                  {plan.storage} GB SSD Storage
                </li>
                <li className="flex items-center text-zinc-300">
                  <Check className="h-5 w-5 mr-3 text-red-500" />
                  {plan.bandwidth} GB Bandwidth
                </li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center text-zinc-400">
        <p className="mb-6">
          All plans include: 24/7 support, 99.9% uptime, and DDOS protection
        </p>
        <Link href="/checkout">
          <Button
            variant="secondary"
            className="border-red-500 text-red-500 hover:bg-red-950"
          >
            Order Now
          </Button>
        </Link>
      </div>
    </>
  );
}
