import { api } from "@/lib/api/client";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UpdateProfilePayload {
  full_name?: string | null;
  email?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export const userService = {
  async getMe(): Promise<UserProfile> {
    return api.get<UserProfile>("/api/v1/users/me");
  },

  async updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
    return api.patch<UserProfile>("/api/v1/users/me", payload);
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.post("/api/v1/users/me/password", payload);
  },
};
