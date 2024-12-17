import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Server, Shield, Zap, Cloud, Globe, Clock, Database, Cog } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <section className="py-32 px-4 bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">Microcloud</h1>
            <h1 className="text-3xl md:text-3xl font-bold mb-6 text-white">
              cloud computing,
              <span className="text-red-500"> made simple.</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
            MicroCloud is a SaaS platform that simplifies cloud computing by offering rapid deployment of containerized VPS hosting with decent performance at an affordable cost, along with an easy-to-use online interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/pricing">
                <Button size="lg" className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white">
                  View Pricing <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-16">
              <div className="p-6 bg-zinc-900 rounded-lg">
                <div className="text-3xl font-bold text-red-500">99.99%</div>
                <div className="text-sm text-zinc-400">Uptime</div>
              </div>
              <div className="p-6 bg-zinc-900 rounded-lg">
                <div className="text-3xl font-bold text-red-500">3</div>
                <div className="text-sm text-zinc-400">Global Locations</div>
              </div>
              <div className="p-6 bg-zinc-900 rounded-lg">
                <div className="text-3xl font-bold text-red-500">1Gbps</div>
                <div className="text-sm text-zinc-400">Network Speed</div>
              </div>
              <div className="p-6 bg-zinc-900 rounded-lg">
                <div className="text-3xl font-bold text-red-500">24/7</div>
                <div className="text-sm text-zinc-400">Expert Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Why Choose <span className="text-red-500">MicroCloud</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors duration-300">
              <Server className="h-12 w-12 mb-6 text-red-500" />
              <h3 className="text-xl font-semibold mb-4 text-white">High Performance</h3>
              <p className="text-zinc-400">
                Enterprise-grade AMD EPYC 7763 processors and NVMe SSDs ensure your applications
                run at peak performance. Experience up to 3x faster processing speeds.
              </p>
            </div>
            <div className="p-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors duration-300">
              <Shield className="h-12 w-12 mb-6 text-red-500" />
              <h3 className="text-xl font-semibold mb-4 text-white">Security First</h3>
              <p className="text-zinc-400">
                DDoS protection, anomaly detections, and enterprise firewalls keep your
                data safe.
              </p>
            </div>
            <div className="p-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors duration-300">
              <Zap className="h-12 w-12 mb-6 text-red-500" />
              <h3 className="text-xl font-semibold mb-4 text-white">Fast Deployment</h3>
              <p className="text-zinc-400">
                Purchases are delivered within 24 hours of payment confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 px-4 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Advanced <span className="text-red-500">Features</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: <Cog className="h-8 w-8 mb-4 text-red-500" />,
                title: "Ubuntu Instances",
                description: "All containers run the latest version of Ubuntu Server"
              },
              {
                icon: <Globe className="h-8 w-8 mb-4 text-red-500" />,
                title: "Global CDN",
                description: "3 edge locations worldwide"
              },
              {
                icon: <Clock className="h-8 w-8 mb-4 text-red-500" />,
                title: "Burstable Instances",
                description: "Dynamic resource allocation"
              },
              {
                icon: <Database className="h-8 w-8 mb-4 text-red-500" />,
                title: "Managed DBs",
                description: "Fully managed database services"
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors duration-300">
                {feature.icon}
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Get Started?</h2>
          <p className="text-xl text-zinc-400 mb-8">
            Join thousands of developers who trust MicroCloud for their hosting needs.
          </p>
          <Link href="/pricing">
          <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white">
            Join now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
