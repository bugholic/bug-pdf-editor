"use client";

import { Mail, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="pt-6 px-5 border-t border-border bg-white pb-5">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span>Need help?</span>
          <a
            href="mailto:developerayu@gmail.com"
            className="text-primary hover:underline"
          >
            Contact Support
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span>© 2025 Bugs'PDF. All rights reserved. Developed by</span>
          <a
            href="https://in.linkedin.com/in/ayuv"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            Bugholic
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
