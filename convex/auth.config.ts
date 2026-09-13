export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://absolute-elf-27.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
