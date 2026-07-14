import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import MicrosoftIcon from "@/components/MicrosoftIcon";
import AuthLayout from "@/components/AuthLayout";

export default function Register() {
  // Registration is social-only. Providers verify email ownership themselves,
  // so there's no one-time code step. Preserve any ?plan= param through OAuth
  // so paid signups continue to Stripe checkout after login.
  const plan = new URLSearchParams(window.location.search).get("plan");
  const fromUrl = plan ? `/dashboard?plan=${plan}` : "/dashboard";

  const handleProvider = (provider) => {
    base44.auth.loginWithProvider(provider, fromUrl);
  };

  return (
    <AuthLayout
      imageSrc="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/890c13e0e_vault.png"
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 font-medium"
          onClick={() => handleProvider("google")}
        >
          <GoogleIcon className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 font-medium"
          onClick={() => handleProvider("microsoft")}
        >
          <MicrosoftIcon className="w-5 h-5 mr-2" />
          Continue with Microsoft
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        By continuing you agree to our{" "}
        <Link to="/terms-of-service" className="text-primary hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </AuthLayout>
  );
}