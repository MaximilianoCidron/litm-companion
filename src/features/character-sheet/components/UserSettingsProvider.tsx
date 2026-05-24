"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useUserSettingsListener } from "../hooks/use-user-settings-listener";
import { defaultSettingsFor, type UserSettings } from "../schemas";

const PLACEHOLDER = defaultSettingsFor("__placeholder__");

const UserSettingsContext = createContext<UserSettings>(PLACEHOLDER);

interface UserSettingsProviderProps {
  uid: string;
  children: ReactNode;
}

export function UserSettingsProvider({
  uid,
  children,
}: UserSettingsProviderProps) {
  const settings = useUserSettingsListener(uid);
  return (
    <UserSettingsContext.Provider value={settings}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings(): UserSettings {
  return useContext(UserSettingsContext);
}
