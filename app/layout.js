export const metadata = {
  title: "Revuly — AI Review Management for Restaurants",
  description: "Monitor Google reviews, generate AI replies, and protect your restaurant's reputation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
