type ParentStatusBanner = {
  message: string;
  tone: "mint" | "rose" | "sky" | "sun";
};

export function getParentStatusBanner(
  code?: string,
): ParentStatusBanner | null {
  void code;
  return null;
}
