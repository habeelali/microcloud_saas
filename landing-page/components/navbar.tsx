"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cloud, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <Cloud className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-primary">MicroCloud</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/features">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link href="/student">
              <Button variant="ghost">Student Offer</Button>
            </Link>
            <Link href="/signin">
              <Button>Sign In</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/pricing">
              <Button variant="ghost" className="w-full text-left">
                Pricing
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="ghost" className="w-full text-left">
                Features
              </Button>
            </Link>
            <Link href="/student">
              <Button variant="ghost" className="w-full text-left">
                Student Offer
              </Button>
            </Link>
            <Link href="/signin">
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}