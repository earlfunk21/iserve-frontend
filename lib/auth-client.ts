import { expoClient } from "@better-auth/expo/client";
import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  basePath: "/auth",
  baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
  plugins: [
    expoClient({
      scheme: "iserv",
      storagePrefix: "iserv",
      storage: SecureStore,
    }),
    inferAdditionalFields({
      user: {
        role: {
          type: ["ADMIN", "USER"],
          input: false,
        },
        referrerId: {
          type: "string",
        },
        publicKey: {
          type: "string",
        },
      },
    }),
    emailOTPClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session.session;
export type User = typeof authClient.$Infer.Session.user;
