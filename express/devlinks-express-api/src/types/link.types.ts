import { UUID } from "node:crypto";

export interface Link {
  id: string | UUID;
  title: string;
  url: string;
  category: string;
  tags: string[];
  clicks: number;
  createdAt: Date | string;
}
