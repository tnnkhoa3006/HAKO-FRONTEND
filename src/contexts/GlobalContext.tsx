"use client";

import React, { ReactNode } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { LogoutProvider } from "@/contexts/LogoutContext";
import { PostProvider } from "@/contexts/PostContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <UserProvider>
        <LogoutProvider>
          <PostProvider>{children}</PostProvider>
        </LogoutProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default GlobalProvider;
