"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
    // .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    // .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    // .regex(/[0-9]/, "Password must contain at least one number")
    // .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  region: z.string().min(1, "Please select a region"),
  plan: z.string().min(1, "Please select a plan"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function CheckoutPage() {
  const [plans, setPlans] = useState<{ name: string; price: number }[]>([]);
  const [regions, setRegions] = useState<{ region_id: number; region_name: string }[]>([]);
  const [plansAvailable, setPlansAvailable] = useState<boolean>(true);
  const [regionsAvailable, setRegionsAvailable] = useState<boolean>(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/plans");
        if (!response.ok) throw new Error("Failed to fetch plans");
        const data = await response.json();
        if (data.length > 0) {
          setPlans(data);
        } else {
          setPlansAvailable(false);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
        setPlansAvailable(false);
      }
    }

    fetchPlans();
  }, []);

  useEffect(() => {
    async function fetchRegions() {
      try {
        const response = await fetch("/api/regions");
        if (!response.ok) throw new Error("Failed to fetch regions");
        const data = await response.json();
        if (data.length > 0) {
          setRegions(data.filter((region: any) => region.available));
        } else {
          setRegionsAvailable(false);
        }
      } catch (error) {
        console.error("Error fetching regions:", error);
        setRegionsAvailable(false);
      }
    }

    fetchRegions();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      region: "",
      plan: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const sessionId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem("SESSIONID", sessionId);

    const selectedPlan = plans.find((plan) => plan.name === values.plan);
    const selectedRegion = regions.find(
      (region) => region.region_name.toLowerCase() === values.region
    );
    const planAmount = selectedPlan ? selectedPlan.price : 0;

    const customerData = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password, // Remember to handle this securely in your API
      region_id: selectedRegion ? selectedRegion.region_id : null,
      customer_number: sessionId
    };
    
    const subscriptionData = {
      plan_id: selectedPlan.plan_id,
      status: "Payment Pending"
    }

    const orderData = {
      customer: customerData,
      subscription: subscriptionData,
    };

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      const result = await response.json();

      if (response.ok && result.customerId) {
        toast({
          title: "Order submitted!",
          description: "Redirecting to payment...",
        });

        await fetch("/api/sendOrderEmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: values.email,
            firstName: values.firstName,
            customerId: result.customerId,
            amount: planAmount,
          }),
        });

        setTimeout(() => {
          router.push(`/payment?customerId=${result.customerId}&planAmount=${planAmount}`);
        }, 3000);
      } else {
        throw new Error("Order submission failed");
      }
    } catch (error) {
      toast({
        title: "Order failed!",
        description: "There was an issue submitting your order. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen py-20 px-4 bg-black">
      <Card className="max-w-md mx-auto bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-white">Complete Your Order</CardTitle>
          <CardDescription className="text-zinc-400">
            Fill in your details to proceed with the purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-300">Personal Information</h3>
                  
                  {/* First Name */}
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">First Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Last Name */}
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Security Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-300">Security</h3>
                  
                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subscription Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-300">Subscription Details</h3>
                  
                  {/* Region Selection */}
                  {regionsAvailable ? (
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300">Region</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue placeholder="Select a region" className="text-white" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              {regions.map((region) => (
                                <SelectItem
                                  key={region.region_id}
                                  value={region.region_name.toLowerCase()}
                                  className="text-white hover:bg-zinc-700"
                                >
                                  {region.region_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="text-red-400">No regions available at the moment.</div>
                  )}

                  {/* Plan Selection */}
                  {plansAvailable ? (
                    <FormField
                      control={form.control}
                      name="plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300">Plan</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue placeholder="Select a plan" className="text-white" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              {plans.map((plan, idx) => (
                                <SelectItem
                                  key={idx}
                                  value={plan.name}
                                  className="text-white hover:bg-zinc-700"
                                >
                                  {plan.name} (${plan.price}/month)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="text-red-400">No plans available at the moment.</div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Complete Purchase
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}