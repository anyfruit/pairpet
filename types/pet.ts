export interface Pet {
  _id: string;
  name: string;
  species?: string;
  level: number;
  exp?: number;
  stage?: "egg" | "baby" | "grow";
  mood?: string;
  intimacy: number;
}
