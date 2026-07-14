import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import MicrosoftIcon from "@/components/MicrosoftIcon";

// Shared social sign-in buttons used on both Login and Register.
// Social providers verify email ownership themselves, so users skip the
// one-time code step and land straight in the app.
export default function SocialAuthButtons({ fromUrl = "/dashboard" }) {
  const handleProvider = (provider) => {
    base44.auth.loginWithProvider(provider, fromUrl);
  };

  return (
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
  );
}