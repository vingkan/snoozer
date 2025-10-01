import { Box } from "@radix-ui/themes";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box p="2">
      <Box>{children}</Box>
    </Box>
  );
}
